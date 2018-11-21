const yaml = require('js-yaml');
const fs = require('fs')
const EventSouce = require('eventsource');
const request = require('request');

const config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8'));
const host = config.host
const token = config.token;

const headers = { 'Authorization': `Bearer ${token}` };

let following = [];
const fetchFollowing = () => {
    request.get({
        url: `${host}/api/v1/accounts/${config.id}/following`,
        headers: headers
    }, (err, res, body) => {
        following = JSON.parse(body).map(account => account.acct);
        console.log('Fetching done');
    });
};
fetchFollowing();

const timelineStreamUrl = `${host}/api/v1/streaming/user`;
const es = new EventSouce(timelineStreamUrl, { headers: headers });
es.addEventListener('update', e => {
    const data = JSON.parse(e.data);
    const status = data.reblog ? data.reblog : data;
    const id = status.id;
    const author = status.account;

    let isToBeBoosted = true;
    if (status.media_attachments.length === 0)        isToBeBoosted = false;
    if (status.reblogged)                             isToBeBoosted = false;
    if (config.blacklist.indexOf(author.acct) !== -1) isToBeBoosted = false;
    if (isToBeBoosted) {
        const isNewPerson = (following.indexOf(author.acct) === -1);
        let text = `New on Mastodon: ${status.url ? status.url : status.uri}`
        if (isNewPerson) {
            text += '\n';
            text += "Currently you're not following him. Fav this toot to follow him.";
            text += ` (${author.id})`;
        }
        request.post({
            url: `${host}/api/v1/statuses`,
            headers: headers,
            json: {
                status: text,
                visibility: 'private'
            }
        });
    }
});
