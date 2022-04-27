const { Octokit } = require("@octokit/rest");
const fs = require('fs')

let oauth_token = '';

const authors = {
    group1: [
        'shahabh3003', 
        'nisarnadaf43', 
        'rajwantprajapati5791', 
        'kondiparthi-sarath-avinetworks',
        'gprasadhk',
        'nitesh-kesarkar-globant',
        'hitesh-mandav',
    ],
    group2: [
        'harmeet-kr',
        'abhineshgour',
        'kumarsuraj27',
        'sarthakkapoor-dev',
        'vgohil-glb',
    ]
};

const reviewers = {
    group1: {
        l1: ['nisarnadaf43', 'rajwantprajapati5791', 'nitesh-kesarkar-globant', 'hitesh-mandav'],
        l2: ['kondiparthi-sarath-avinetworks', 'gprasadhk'],
        l3: 'aravindh-nagarajan',
    },
    group2: {
        l1: ['abhineshgour', 'sarthakkapoor-dev', 'vgohil-glb', 'shreyasghare-globant'],
        l2: ['harmeet-kr', 'kumarsuraj27'],
        l3: 'aggarwalra',
    },
};

/**
 * Updates reviewers.
 */
function updateReviewers(prNumber, reviewers, octokit) {
    return octokit.rest.pulls.requestReviewers({
        owner: 'avinetworks',
        repo: "avi-dev",
        pull_number: prNumber,
        reviewers,
    });
}

/**
 * Returns pullrequest info.
 */
function getPullRequest(prNumber, octokit) {
    return octokit.rest.pulls.get({
        owner: 'avinetworks',
        repo: "avi-dev",
        pull_number: prNumber,
    });
}

/**
 * Returns Reviewers.
 */
function getReviewers(author, level) {
    const group = authors.group1.includes(author) ? 'group1' : 'group2';
    const reviewGroup = reviewers[group];
    let prReviewers = [];
    level = level.toLocaleLowerCase();

    switch(level) {
        case 'l1': {
            prReviewers = getL1Reviewers(author, reviewGroup);

            break;
        }

        case 'l2': {
            prReviewers = getL2Reviewers(author, reviewGroup);

            break;
        }

        case 'l3': {
            prReviewers.push(reviewGroup.l3);

            break;
        }

        case 'all': {
            prReviewers = [
                ...getL1Reviewers(author, reviewGroup),
                ...getL2Reviewers(author, reviewGroup),
                reviewGroup.l3,
            ];
        }
    }
    
    return prReviewers;
}

/**
 * Returns L1 Reviewers.
 */
function getL1Reviewers(author, reviewGroup) {
    const prReviewers = [];
    let count = 0;

    reviewGroup.l1.forEach(r => {
        if (r !== author && count <= 2) {
            prReviewers.push(r);

            count++;
        }
    });

    return prReviewers;
}

/**
 * Returns L2 Reviewers.
 */
function getL2Reviewers(author, reviewGroup) {
    const prReviewers = [];

    reviewGroup.l2.forEach(r => {
        if (r !== author) {
            prReviewers.push(r);
        }
    });

    return prReviewers;
}

/**
 * Assigns reviewers to PR.
 */
async function assign(prNumber, level = 'l1') {
    oauth_token = fs.readFileSync('./auth.txt', 'utf8');

    const octokit = new Octokit({
        auth: oauth_token.trim(),
    });
    
    const { data: pr } = await getPullRequest(prNumber, octokit);

    const author = pr.user.login;

    const reviewers = getReviewers(author, level);

    console.log(prNumber, author, level)

    updateReviewers(+prNumber, reviewers, octokit);

    return reviewers;
}

async function getPendingReviewers(prNumber) {
    oauth_token = fs.readFileSync('./auth.txt', 'utf8');

    const octokit = new Octokit({
        auth: oauth_token.trim(),
    });

    const { data: { users } } = await octokit.rest.pulls.listRequestedReviewers({
        owner: 'avinetworks',
        repo: "avi-dev",
        pull_number: prNumber,
    });

    return users.map(u => u.login);
}

module.exports = {
    assign,
    getPendingReviewers,
};
