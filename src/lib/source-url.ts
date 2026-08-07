/**
 * Source links are built here and nowhere else, so the shape of the link is
 * stated once: the repository's own page when nothing narrower is named, and a
 * folder on the default branch when a repository-relative path is.
 */

/** The repository every source link points into. */
export const REPOSITORY_URL = "https://github.com/writebetacode/playground";

/** The branch source links resolve against. */
export const DEFAULT_BRANCH = "main";

/**
 * Builds the source link for a repository-relative folder, or for the repository
 * itself when no folder is given. Whether the folder exists is GitHub's business:
 * an unwritten path still resolves to a URL, and GitHub answers it with its own
 * not-found page.
 */
export function buildSourceUrl(sourcePath?: string | null): string {
	const folder = (sourcePath ?? "").trim().replace(/^\/+|\/+$/g, "");
	if (folder === "") {
		return REPOSITORY_URL;
	}
	return `${REPOSITORY_URL}/tree/${DEFAULT_BRANCH}/${folder}`;
}
