const git = require('simple-git/promise')();

const remote = `https://${process.env.GITHUB_RELEASE_TOKEN}@github.com/BrightspaceUI/core`;
const branchName = 'travis-commit-experiment-pr';

function commit() {

	git.addConfig('user.name', 'BrightspaceGitHubReader');
	git.addConfig('user.email', 'brightspacegithubreader@d2l.com');
	git.addConfig('push.default', 'simple');

	console.log('Committing, tagging and pushing...');
	console.group();
	const branchName2 = 'refs/heads/travis-commit-experiment:refs/remotes/origin/travis-commit-experiment';

	return git.checkoutLocalBranch(branchName)
		.then(() => {
			return git.branch();
		}).then((data) => {
			if (data.current !== branchName) {
				process.exit(1);
			}
			console.log('Checked out branch ' + branchName)

			const commitMessage = '[skip ci] test commit';
			return git.commit(commitMessage, 'new-file.txt');
		}).then((status) => {
			console.log(status);
			console.log('Committed. Pushing...');
			// return git.push(remote, branchName);
		});
}

commit()
	.then(() => {
		console.groupEnd();
		console.log('Committed successfully.');
		process.exit(0);
	}).catch((err) => {
		console.error(err);
		console.groupEnd();
		process.exit(1);
	});
