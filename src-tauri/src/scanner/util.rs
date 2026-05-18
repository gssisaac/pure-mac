use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use walkdir::WalkDir;

pub fn expand_path(p: &str, home: &Path) -> PathBuf {
    let trimmed = p.trim();
    if let Some(rest) = trimmed.strip_prefix("~/") {
        home.join(rest)
    } else if trimmed == "~" {
        home.to_path_buf()
    } else {
        PathBuf::from(trimmed)
    }
}

pub fn canonical_or_same(p: &Path) -> PathBuf {
    fs::canonicalize(p).unwrap_or_else(|_| p.to_path_buf())
}

fn normalized_path_str(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

/// Hard-coded safety: never surface these paths as scan results.
pub fn is_never_touch_scan_path(home: &Path, path: &Path) -> bool {
    let s = normalized_path_str(path);
    let home_s = normalized_path_str(home);

    if s.contains("/.ssh")
        || s.ends_with("/.ssh")
        || s.contains("/.gnupg")
        || s.ends_with("/.gnupg")
    {
        return true;
    }

    if s.starts_with("/System")
        || s.starts_with("/usr")
        || s.starts_with("/bin")
        || s.starts_with("/sbin")
        || s.starts_with("/etc")
        || s.starts_with("/Library")
    {
        return true;
    }

    let keychains = format!("{}/Library/Keychains", home_s.trim_end_matches('/'));
    let passwords = format!("{}/Library/Passwords", home_s.trim_end_matches('/'));
    if s.starts_with(&keychains) || s.starts_with(&passwords) {
        return true;
    }

    false
}

pub fn is_excluded(path: &Path, exclude_paths: &[String], home: &Path) -> bool {
    let canon = canonical_or_same(path);
    let cs = normalized_path_str(&canon);
    for ex in exclude_paths {
        let exp = expand_path(ex, home);
        let ec = canonical_or_same(&exp);
        let es = normalized_path_str(&ec);
        if cs.starts_with(&es) || es.starts_with(&cs) {
            return true;
        }
    }
    false
}

pub fn dir_size(path: &Path) -> io::Result<u64> {
    let mut total = 0u64;
    for entry in WalkDir::new(path)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.file_type().is_file() {
            total += entry.metadata().map(|m| m.len()).unwrap_or(0);
        }
    }
    Ok(total)
}

pub fn file_mtime_unix(path: &Path) -> io::Result<i64> {
    let m = fs::metadata(path)?;
    let modified = m.modified()?;
    Ok(modified
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64)
}

pub fn file_age_days(path: &Path) -> io::Result<i64> {
    let mt = file_mtime_unix(path)?;
    let now = chrono::Utc::now().timestamp();
    Ok((now - mt) / 86_400)
}

pub static DOTFILE_WHITELIST: &[&str] = &[
    ".ssh",
    ".gnupg",
    ".gitconfig",
    ".gitignore_global",
    ".zshrc",
    ".zsh_history",
    ".bashrc",
    ".bash_profile",
    ".bash_history",
    ".config",
    ".local",
    ".vimrc",
    ".vim",
    ".emacs",
    ".emacs.d",
    ".profile",
    ".inputrc",
    ".cups",
    ".Trash",
];
