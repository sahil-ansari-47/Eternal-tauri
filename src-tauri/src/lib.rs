use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

#[tauri::command]
async fn git_command(
    action: String,
    payload: serde_json::Value,
) -> Result<serde_json::Value, String> {
    use std::process::Command;
    let maybe_path = payload["workspace"].as_str();
    let path = match maybe_path {
        Some(p) if !p.trim().is_empty() => p,
        _ => {
            return Err("Missing workspace path".into());
        }
    };
    println!("Running git command: {} in {}", action, path);
    if action == "init" {
        let out = Command::new("git")
            .arg("init")
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;
        println!("{}", String::from_utf8_lossy(&out.stdout));
        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }
    if action == "status" {
        let out = Command::new("git")
            .arg("status")
            .arg("--porcelain")
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }

        let text = String::from_utf8_lossy(&out.stdout);
        let mut staged = vec![];
        let mut unstaged = vec![];
        let mut untracked = vec![];

        for line in text.lines() {
            if line.len() < 3 {
                continue;
            }
            let status_code = &line[0..2];
            let file = line[3..].to_string();
            match status_code {
                "M " | "A " | "D " => {
                    staged.push(serde_json::json!({ "path": file, "status": status_code }))
                }
                " M" | " D" => {
                    unstaged.push(serde_json::json!({ "path": file, "status": status_code }))
                }
                "??" => untracked.push(serde_json::json!({ "path": file, "status": status_code })),
                _ => {}
            }
        }

        // branch
        let branch_out = Command::new("git")
            .args(["rev-parse", "--abbrev-ref", "HEAD"])
            .current_dir(path)
            .output();

        let branch = match branch_out {
            Ok(b) if b.status.success() => String::from_utf8_lossy(&b.stdout).trim().to_string(),
            _ => "master".to_string(),
        };

        // remote origin
        let origin_out = Command::new("git")
            .args(["remote", "get-url", "origin"])
            .current_dir(path)
            .output()
            .ok();

        let origin = origin_out
            .and_then(|o| {
                if o.status.success() {
                    Some(String::from_utf8_lossy(&o.stdout).trim().to_string())
                } else {
                    None
                }
            })
            .unwrap_or_default();
        println!("stdout: {:?}", String::from_utf8_lossy(&out.stdout));
        println!("stderr: {:?}", String::from_utf8_lossy(&out.stderr));
        println!("exit code: {:?}", out.status.code());

        return Ok(serde_json::json!({
            "staged": staged,
            "unstaged": unstaged,
            "untracked": untracked,
            "branch": branch,
            "origin": origin
        }));
    }

    if action == "sync-status" {
        // First fetch to update remote refs
        let _ = Command::new("git")
            .args(["fetch"])
            .current_dir(path)
            .output();

        // Check commits ahead (to push)
        let ahead = Command::new("git")
            .args(["rev-list", "--count", "@{u}..HEAD"])
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;

        // Check commits behind (to pull)
        let behind = Command::new("git")
            .args(["rev-list", "--count", "HEAD..@{u}"])
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;

        let ahead_count = String::from_utf8_lossy(&ahead.stdout)
            .trim()
            .parse::<i32>()
            .unwrap_or(0);
        let behind_count = String::from_utf8_lossy(&behind.stdout)
            .trim()
            .parse::<i32>()
            .unwrap_or(0);

        return Ok(serde_json::json!({
            "ahead": ahead_count,
            "behind": behind_count
        }));
    }

    if action == "stage" {
        let out = Command::new("git")
            .arg("add")
            .arg(payload["file"]["path"].as_str().unwrap_or(""))
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }
        println!("{}", String::from_utf8_lossy(&out.stdout));
        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }

    if action == "stage-all" {
        let out = Command::new("git")
            .arg("add")
            .arg(".")
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }
        println!("{}", String::from_utf8_lossy(&out.stdout));
        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }

    if action == "unstage-all" {
        let out = Command::new("git")
            .arg("reset")
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }
        println!("{}", String::from_utf8_lossy(&out.stdout));
        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }

    if action == "discard" {
        let out = Command::new("git")
            .arg("reset")
            .arg("--")
            .arg(payload["file"]["path"].as_str().unwrap_or(""))
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }
        println!("{}", String::from_utf8_lossy(&out.stdout));
        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }

    if action == "discard-all" {
        let out = Command::new("git")
            .arg("reset")
            .arg("--hard")
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }
        println!("{}", String::from_utf8_lossy(&out.stdout));
        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }
    if action == "unstage" {
        let file_path = payload["file"]["path"].as_str().unwrap_or("");
        println!("Unstaging file: {:?}", file_path);

        // Check if HEAD exists
        let head_exists = Command::new("git")
            .args(["rev-parse", "--verify", "HEAD"])
            .current_dir(path)
            .output()
            .map(|out| out.status.success())
            .unwrap_or(false);

        let out = if head_exists {
            // Repo has commits → safe to use restore
            Command::new("git")
                .args(["restore", "--staged", file_path])
                .current_dir(path)
                .output()
        } else {
            // Repo has no commits yet → use rm --cached fallback
            Command::new("git")
                .args(["rm", "--cached", file_path])
                .current_dir(path)
                .output()
        }
        .map_err(|e| e.to_string())?;

        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }

        println!("Unstaged successfully: {}", file_path);
        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }
    if action == "commit" {
        let out = Command::new("git")
            .arg("commit")
            .arg("-m")
            .arg(payload["message"].as_str().unwrap_or(""))
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }
        println!("{}", String::from_utf8_lossy(&out.stdout));
        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }
    if action == "push" {
        let out = Command::new("git")
            .arg("push")
            .arg(payload["remote"].as_str().unwrap_or("origin"))
            .arg(payload["branch"].as_str().unwrap_or("master"))
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }
        println!("{}", String::from_utf8_lossy(&out.stdout));
        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }
    if action == "branch" {
        let out = Command::new("git")
            .arg("branch")
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;

        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }

        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }
    if action == "create branch" {
        let out = Command::new("git")
            .arg("checkout")
            .arg("-b")
            .arg(payload["name"].as_str().unwrap_or(""))
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;

        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }

        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }
    if action == "checkout" {
        let out = Command::new("git")
            .arg("checkout")
            .arg(payload["name"].as_str().unwrap_or(""))
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;

        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }

        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }
    if action == "pull" {
        let out = Command::new("git")
            .arg("pull")
            .arg(payload["remote"].as_str().unwrap_or("origin"))
            .arg(payload["branch"].as_str().unwrap_or("master"))
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }
        println!("{}", String::from_utf8_lossy(&out.stdout));
        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }
    if action == "set-remote" {
        let out = Command::new("git")
            .arg("remote")
            .arg("add")
            .arg("origin")
            .arg(payload["url"].as_str().unwrap_or(""))
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;
        if !out.status.success() {
            return Err(format!(
                "Git command failed (exit {}): {}\n{}",
                out.status.code().unwrap_or(-1),
                String::from_utf8_lossy(&out.stderr),
                String::from_utf8_lossy(&out.stdout)
            ));
        }
        println!("{}", String::from_utf8_lossy(&out.stdout));
        return Ok(serde_json::json!({
            "stdout": String::from_utf8_lossy(&out.stdout),
            "stderr": String::from_utf8_lossy(&out.stderr)
        }));
    }
    if action == "graph" {
        use regex::Regex;
        let output = Command::new("git")
            .arg("log")
            .arg("--graph")
            .arg("--pretty=format:%h|%s|%d")
            .current_dir(path)
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err(String::from_utf8_lossy(&output.stderr).to_string());
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let re = Regex::new(r"^([|\\/\* ]*)(.*)$").unwrap();

        let mut commits = Vec::new();

        for line in stdout.lines() {
            if let Some(caps) = re.captures(line) {
                let graph_ascii = caps
                    .get(1)
                    .map(|m| m.as_str().to_string())
                    .unwrap_or_default();
                let rest = caps.get(2).map(|m| m.as_str()).unwrap_or("").trim();

                let fields: Vec<&str> = rest.splitn(3, '|').collect();
                let hash = fields.get(0).unwrap_or(&"").trim();
                let message = fields.get(1).unwrap_or(&"").trim();
                let refs = fields.get(2).unwrap_or(&"").trim();

                // Skip graph-only continuation lines (like "\" or "|")
                if hash.is_empty() && message.is_empty() {
                    commits.push(serde_json::json!({
                        "graph": graph_ascii,
                        "hash": "",
                        "message": "",
                        "isHead": false,
                        "remote": false
                    }));
                    continue;
                }

                commits.push(serde_json::json!({
                    "graph": graph_ascii,
                    "hash": hash,
                    "message": message,
                    "isHead": refs.contains("HEAD"),
                    "remote": refs.contains("origin"),
                }));
            }
        }

        return Ok(commits.into());
    }

    Err(format!("Unknown git action: {}", action))
}

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
                        content
                            .replace_range(index..index + query_clone.len(), &replace_text_clone);
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
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_pty::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            search_in_workspace,
            replace_in_workspace,
            git_clone,
            git_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
