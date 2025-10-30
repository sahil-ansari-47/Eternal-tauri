use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

#[tauri::command]
async fn git_clone(repo_url: String, target_dir: String) -> Result<bool, String> {
    if repo_url.is_empty() || target_dir.is_empty() {
        return Err("Repository URL and target directory are required".into());
    }

    let output = Command::new("git")
        .args(["clone", &repo_url, &target_dir])
        .output()
        .map_err(|e| format!("Failed to start git process: {}", e))?;

    if output.status.success() {
        Ok(true)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!(
            "Git clone failed with code {}: {}",
            output.status.code().unwrap_or(-1),
            stderr
        ))
    }
}

#[derive(Deserialize)]
pub struct SearchOptions {
    match_case: bool,
    whole_word: bool,
    regex: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchLine {
    line: usize,
    text: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    file_path: String,
    matches: Vec<MatchLine>,
}

#[tauri::command]
async fn search_in_workspace(
    workspace: String,
    query: String,
    options: SearchOptions,
) -> Result<Vec<SearchResult>, String> {
    use regex::RegexBuilder;
    use std::sync::Arc;
    use tokio::task;

    println!("Starting search in: {}", workspace);

    let workspace_path = PathBuf::from(&workspace);
    if !workspace_path.exists() {
        return Err("Workspace path does not exist".into());
    }
    let pattern = if options.regex {
        query.clone()
    } else if options.whole_word {
        format!(r"\b{}\b", regex::escape(&query))
    } else {
        regex::escape(&query)
    };

    let regex = RegexBuilder::new(&pattern)
        .case_insensitive(!options.match_case)
        .build()
        .map_err(|e| format!("Invalid regex: {}", e))?;

    let regex = Arc::new(regex);
    let results = task::spawn_blocking(move || {
        let mut results = Vec::new();

        for entry in walkdir::WalkDir::new(&workspace_path)
            .max_depth(3)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|e| e.file_type().is_file())
        {
            let path = entry.path();
            if let Ok(meta) = fs::metadata(path) {
                if meta.len() > 1_000_000 {
                    continue;
                }
            }

            if let Ok(content) = fs::read_to_string(path) {
                let mut matches = Vec::new();

                for (i, line) in content.lines().enumerate() {
                    if regex.is_match(line) {
                        matches.push(MatchLine {
                            line: i + 1,
                            text: line.to_string(),
                        });
                    }
                }

                if !matches.is_empty() {
                    results.push(SearchResult {
                        file_path: path.display().to_string(),
                        matches,
                    });
                }
            }
        }
        println!("Finished search in: {}", workspace_path.display());
        results
    })
    .await
    .map_err(|e| format!("Search task failed: {}", e))?;

    Ok(results)
}

#[derive(Deserialize)]
pub struct ReplaceOptions {
    replace_next: bool,
    replace_all: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplaceResult {
    replaced: usize,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResultInput {
    file_path: String,
}

#[tauri::command]
async fn replace_in_workspace(
    query: String,
    results: Vec<SearchResultInput>,
    replace_text: String,
    options: ReplaceOptions,
) -> Result<ReplaceResult, String> {
    use tokio::task;

    if results.is_empty() || query.is_empty() {
        return Ok(ReplaceResult { replaced: 0 });
    }

    let query_clone = query.clone();
    let replace_text_clone = replace_text.clone();

    let replaced_count = task::spawn_blocking(move || {
        let mut replaced_count = 0;

        for result in results {
            let path = PathBuf::from(&result.file_path);

            if let Ok(mut content) = fs::read_to_string(&path) {
                if options.replace_next {
                    if let Some(index) = content.find(&query_clone) {
                        content.replace_range(index..index + query_clone.len(), &replace_text_clone);
                        if let Err(err) = fs::write(&path, &content) {
                            eprintln!("Error writing to file {}: {}", path.display(), err);
                            continue;
                        }
                        replaced_count += 1;
                        break; // stop after first replacement
                    }
                }

                if options.replace_all {
                    let occurrences = content.matches(&query_clone).count();
                    if occurrences > 0 {
                        content = content.replace(&query_clone, &replace_text_clone);
                        if let Err(err) = fs::write(&path, &content) {
                            eprintln!("Error writing to file {}: {}", path.display(), err);
                            continue;
                        }
                        replaced_count += occurrences;
                    }
                }
            }
        }

        replaced_count
    })
    .await
    .map_err(|e| format!("Replace task failed: {}", e))?;

    Ok(ReplaceResult {
        replaced: replaced_count,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_pty::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![search_in_workspace, replace_in_workspace, git_clone])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
