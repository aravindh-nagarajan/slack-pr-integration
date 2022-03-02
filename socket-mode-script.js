const { App } = require('@slack/bolt');
const { assign } = require('./github-pr-script.js');

// Initialize App with tokens.
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
});

/**
 * Handler for assignreviewer command.
 */
app.command('/assignreviewer', async ({ command, ack, body, client, logger, say }) => {
    const { text } = command;

    await ack();

    const args = text.split(' ');

    const prNumber = Number(args[0]);

    if (args.length === 2) {
        try {
            await assign(prNumber, args[1]);

            await say(`<https://github.com/avinetworks/avi-dev/pull/${prNumber}|#${prNumber}> is submitted for ${args[1].toLocaleUpperCase()} Review. :tada:`);
        } catch(e) {
            logger.error(e);

            await say('Something went wrong, Sorry');
        }
        
    } else {
        showLevelSelectionModal(body.trigger_id, client, prNumber, body.channel_id);
    }
});

/**
 * Opens modal for level selection
 */
async function showLevelSelectionModal(triggerId, client, prNumber, channelId) {
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
                private_metadata: `${prNumber} ${channelId}`,
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

    try {
        const { level } = view.state.values;
        const { 'level-select-action': levelSelection } = level;
        const selectedLevel = levelSelection.selected_option.value;

        await assign(+prNumber, selectedLevel);

        await client.chat.postMessage({
            channel: channelId,
            text: `<https://github.com/avinetworks/avi-dev/pull/${prNumber}|#${prNumber}> is submitted for ${selectedLevel.toLocaleUpperCase()} Review. :tada:`,
        });
    } catch(e) {
        logger.error(e);
         
        await client.chat.postMessage({
            channel: channelId,
            text: `Something went wrong, Sorry`,
        });
    }
});

(async () => {
    // Start your app
    await app.start();

    console.log('Powered by ⚡️ :) :) !');
})();