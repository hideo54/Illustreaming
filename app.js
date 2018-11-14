const yaml = require('js-yaml');
const fs = require('fs')
const EventSouce = require('eventsource');
const request = require('request');

const config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8'));
const host = config.host
const token = config.token;

const headers = { 'Authorization': `Bearer ${token}` };

const timelineStreamUrl = `${host}/api/v1/streaming/user`;
const es = new EventSouce(timelineStreamUrl, { headers: headers });
es.addEventListener('update', e => {
    const data = JSON.parse(e.data);
    const status = data.reblog ? data.reblog : data;
    const id = status.id;
    const author = status.account.display_name;
    if (status.media_attachments.length === -1) {
        if (config.blacklist.indexOf(author) < 0) {
            request.post({
                url: `${host}/api/v1/statuses/${id}/reblog`,
                headers: headers
            });
        }
    }
});
