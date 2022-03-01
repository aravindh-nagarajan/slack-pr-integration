/*
   Data can be retrieved from the API either using callbacks (as in versions < 1.0)
   or using a new promise-based API. The promise-based API returns the raw Axios
   request promise.
 */

const { Octokit } = require("@octokit/rest");

const OAUTH_TOKEN = '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';
const USERNAME = 'abhineshgour';

const octokit = new Octokit({
    auth: OAUTH_TOKEN,
});

const authors = {
    group1: [
        'shahabh3003', 
        'nisarnadaf43', 
        'rajwantprajapati5791', 
        'kondiparthi-sarath-avinetworks',
        'ratan-kumar-1991',
        'gprasadhk',
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
        l1: ['nisarnadaf43', 'rajwantprajapati5791', 'ratan-kumar-1991'],
        l2: ['kondiparthi-sarath-avinetworks', 'gprasadhk'],
        l3: 'aravindh-nagarajan',
    },
    group2: {
        l1: ['abhineshgour', 'sarthakkapoor-dev', 'vgohil-glb'],
        l2: ['harmeet-kr', 'kumarsuraj27'],
        l3: 'aggarwalra',
    },
};

function updateReviewers(prNumber, reviewers) { console.log(prNumber, reviewers)
    return octokit.rest.pulls.requestReviewers({
        owner: 'avinetworks',
        repo: "avi-dev",
        pull_number: prNumber,
        reviewers,
    });
}

function getReviewers(author = USERNAME) {
    const group = authors.group1.includes(author) ? 'group1' : 'group2';
    const reviewGroup = reviewers[group];
    const prReviewers = [];

    let count = 0;

    reviewGroup.l1.forEach(r => {
        if (r !== author && count <= 2) {
            prReviewers.push(r);

            count++;
        }
    });

    reviewGroup.l2.forEach(r => {
        if (r !== author) {
            prReviewers.push(r);
        }
    });

    prReviewers.push(reviewGroup.l3);

    return prReviewers;
}

function assign(prNumber, author) { console.log(author)
    const reviewers = getReviewers(author);

    return updateReviewers(+prNumber, reviewers);
}

module.exports = {
    assign,
};
