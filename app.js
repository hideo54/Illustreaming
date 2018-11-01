const yaml = require('js-yaml');
const fs = require('fs')
const EventSouce = require('eventsource');
const request = require('request');

const config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8'));
const host = config.host
const token = config.token;

const headers = { 'Authorization': `Bearer ${token}` };

const streamedTimelineUrl = `${host}/api/v1/streaming/user`;
const es = new EventSouce(streamedTimelineUrl, { headers: headers });
es.addEventListener('update', e => {
    const data = JSON.parse(e.data);
    const id = data.id;
    if (data.media_attachments.length > 0) {
        request.post({
            url: `${host}/api/v1/statuses/${id}/reblog`,
            headers: headers
        });
    };
});
