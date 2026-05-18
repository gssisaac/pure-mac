use std::path::Path;

use crate::models::DeleteResult;

pub fn move_paths_to_trash(paths: &[String], dry_run: bool) -> Result<DeleteResult, String> {
    let mut succeeded = Vec::new();
    let mut failed = Vec::new();
    let mut bytes_freed = 0u64;

    for p in paths {
        let path = Path::new(p);
        let size = crate::scanner::util::dir_size(path)
            .ok()
            .or_else(|| std::fs::metadata(path).ok().map(|m| m.len()))
            .unwrap_or(0);

        if dry_run {
            succeeded.push(p.clone());
            bytes_freed += size;
            continue;
        }

        match trash::delete(path) {
            Ok(_) => {
                succeeded.push(p.clone());
                bytes_freed += size;
            }
            Err(e) => failed.push((p.clone(), e.to_string())),
        }
    }

    Ok(DeleteResult {
        succeeded,
        failed,
        bytes_freed,
    })
}
