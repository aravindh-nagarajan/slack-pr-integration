const { App } = require('@slack/bolt');
const { assign } = require('./github-pr-script.js');

// Initialize App with tokens.
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
});

const usernameHash = {
    'shahabh3003': 'shahabh', 
    'nisarnadaf43': 'nnadaf', 
    'rajwantprajapati5791': 'rajawantp', 
    'kondiparthi-sarath-avinetworks': 'kshanmukhasa',
    'ratan-kumar-1991': 'kratan',
    'gprasadhk': 'gprasadhk',
    'harmeet-kr': 'hakaur',
    'abhineshgour': 'agour',
    'kumarsuraj27': 'skumar27',
    'sarthakkapoor-dev': 'kapoorsa',
    'vgohil-glb': 'vgohil',
    'aravindh-nagarajan': 'aravindhn',
    'aggarwalra': 'aggarwalra',
};

function getReviewersSlackIds(reviewers) {
    const ids = [];

    reviewers.forEach(r => {
        ids.push(usernameHash[r]);
    });

    return ids;
}

app.command('/reviewremind', async ({ command, ack, body, client, logger, say }) => {
    const { text = '', user_name: userName } = command;

    await ack();

    const args = text.split(' ') || [];

    const prNumber = Number(args[0]);

    if (prNumber) {
        const reviewers = await getPendingReviewers();

        const reviewersIds = getReviewersSlackIds(reviewers);

        reviewersIds.forEach(async r => {
            try {
                await client.chat.postMessage({
                    channel: `@${r}`,
                    text: `Hi <@${r}>, Gentle Reminder: <https://github.com/avinetworks/avi-dev/pull/${prNumber}|#${prNumber}> is waiting for your review.`,
                });
            } catch(e) {
                logger.error(e);
    
                console.error(r);
            }
        });

        await say(`Hi <@${userName}> !!! Reminder sent.`);
    }
});

/**
 * Handler for assignreviewer command.
 */
app.command('/assignreviewer', async ({ command, ack, body, client, logger, say }) => {
    const { text = '', user_name: userName } = command;

    await ack();

    const args = text.split(' ') || [];

    const prNumber = Number(args[0]);

    // For testing purpose
    if (args.length === 1 && args[0] === 'ping') {
        await say(`Hi <@${userName}> !!! Server is up and running.`);

        return;
    }

    if (args.length === 2) {
        try {
            const reviewers = await assign(prNumber, args[1]);

            await say(`Hi <@${userName}> !!! <https://github.com/avinetworks/avi-dev/pull/${prNumber}|#${prNumber}> is submitted for ${args[1].toLocaleUpperCase()} Review.`);
        
            const reviewersIds = getReviewersSlackIds(reviewers);

            reviewersIds.forEach(async r => {
                try {
                    await client.chat.postMessage({
                        channel: `@${r}`,
                        text: `Hi <@${r}>, <https://github.com/avinetworks/avi-dev/pull/${prNumber}|#${prNumber}> is waiting for your review.`,
                    });
                } catch(e) {
                    logger.error(e);

                    console.error(r);
                }
            });
        } catch(e) {
            logger.error(e);

            await say(`Hi <@${userName}> !!!, Something went wrong, Sorry`);
        }
        
    } else {
        showLevelSelectionModal(body.trigger_id, client, prNumber, body.channel_id, userName);
    }
});

/**
 * Opens modal for level selection
 */
async function showLevelSelectionModal(triggerId, client, prNumber, channelId, userName) {
    try {
        await client.views.open({
            trigger_id: triggerId,
            view: {
                type: 'modal',
                callback_id: 'level_selection',
                title: {
                    type: 'plain_text',
                    text: 'Level of Review'
                },
                private_metadata: `${prNumber} ${channelId} ${userName}`,
                blocks: [{
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: 'Select your PR level'
                    },
                    block_id: 'level',
                    accessory: {
                        type: 'static_select',
                        placeholder: {
                            type: 'plain_text',
                            text: 'Select your PR level',
                        },
                        options: [
                            {
                                text: {
                                    type: 'plain_text',
                                    text: 'Level 1',
                                },
                                value: 'l1',
                            },
                            {
                                text: {
                                    type: 'plain_text',
                                    text: 'Level 2',
                                },
                                value: 'l2',
                            },
                            {
                                text: {
                                    type: 'plain_text',
                                    text: 'Level 3',
                                },
                                value: 'l3',
                            },
                            {
                                text: {
                                    type: 'plain_text',
                                    text: 'All Levels',
                                },
                                value: 'all',
                            }
                        ],
                        action_id: 'level-select-action',
                    },
                }],
                submit: {
                    type: 'plain_text',
                    text: 'Submit'
                }
            }
        });
    }
    catch (error) {
        throw error;
    }
}

/**
 * Handler for level selection modal submit.
 */
app.view('level_selection', async ({ ack, view, client, body, logger }) => {
    await ack();

    // metadata contains prNumber and channel
    const metaData = body.view.private_metadata.split(' ');

    const prNumber = +metaData[0];
    const channelId = metaData[1];
    const userName = metaData[2];

    try {
        const { level } = view.state.values;
        const { 'level-select-action': levelSelection } = level;
        const selectedLevel = levelSelection.selected_option.value;

        const reviewers = await assign(+prNumber, selectedLevel);

        await client.chat.postMessage({
            channel: channelId,
            text: `Hi <@${userName}> !!! <https://github.com/avinetworks/avi-dev/pull/${prNumber}|#${prNumber}> is submitted for ${selectedLevel.toLocaleUpperCase()} Review.`,
        });

        const reviewersIds = getReviewersSlackIds(reviewers);

        reviewersIds.forEach(async r => {
            await client.chat.postMessage({
                channel: `@${r}`,
                text: `Hi <@${r}>, <https://github.com/avinetworks/avi-dev/pull/${prNumber}|#${prNumber}> is waiting for your review`,
            });
        });
    } catch(e) {
        logger.error(e);
         
        await client.chat.postMessage({
            channel: channelId,
            text: `Hi <@${userName}> !!!, Something went wrong, Sorry`,
        });
    }
});

(async () => {
    // Start your app
    await app.start();

    console.log('Powered by ⚡️ :) :) !');
})();