const { google } = require('googleapis');

async function main() {
    const credentials = {
        "client_email": "dna-crm-calendar@dna-crm-489518.iam.gserviceaccount.com",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCtlzApuZnvrfWI\nw8fU3KP/XDqogRTchf9fPQk/nQ4IR841SgTg8d2BmNCqZwro12PlRTjS9hV9EZp3\n48rDB3F9wgd2XOfvhClTxeTrW9VIKRnYLGBHqVpsUjNQfnOR5kNcwENl+274u61t\nONTOatf19Yfg1Ubb/NDnML4wg+egBajrWmZJIkzcOwyxzgyiIjuQg6NUKl6o+zzu\n5rqWl8r7YqDQzZHGOaeH+PmD0bWwJr+EHMbF3wDmzZ23DHfSBRjnb0fg8+Lb9to0\nFeB9OWs/VNe0qsusTH2w1BFucu/STU8as+7E/vYG2/pcQIetEiOHztHQhRyhRh8X\nm3wNSnDPAgMBAAECggEAJ8L3Nb99KqDSmnqZ1cCaUf4qs3kpsZ+B0KtW6HrNgYkN\nCzjCqFHOVoaN2VJT9eSMTbJO40eZwXWcR7TmN0kHrnIYqnx6ZesEWlt8ZYq57lb3\nxAPaI9//RcuIVHo6d6NiL6ccaQowL4oxndCEMinYAM82SgIgQniE00ffcJZuIkF5\nBOvKCVa8++VUWXlj2o1oYaw4XypiO0bqG8sAfRfvyfYPQSx8+vuZ4el4TZoA3nML\nxCvUsgBaQgDOaawZNzPTE5KBjxAFLtBTIENR6HJbQBqcPUjET9BFBX8bqHQ+GO9f\nDVAi7YEIBxRfPzdhSEPI2PxZj5+E0KNgo95N1MCeeQKBgQDYvn7tylJI8eqm14+u\nSb4mWcwBhB8eHn42Tx8C3T7Wk5Q0Nxm7TDDJj4HNkGG2V7OoHVjppX/aWCIrKR8v\ndstvRodVQKFPbZhKuyk5rRNJsJn0YleXqhb28pbLHG7hK9JFkHfeBQE5VDxiu9ME\nnWV0dzGttXfEc1zX0V0l/Dh0GQKBgQDNB9iDOnlgpoMcbn60xhv7PWAAXkZr2rbq\njxUyJD/LTK9omOwjOhUQDFgP8G5K5vn276tv0Ndoev0giReNSCZuD+Xfnm2iwbFu\n8x1Eu7s10WC6cifKpnE72QUSaq1SYCkhC5MLDTpCf5M/mmFPZRhIFQku6wlP9PLv\nPVNPB/bpJwKBgAw09lsYGPhIv6lz3IC5YH8ycX3oXgRJPVx7qkh0A3T8TM2ACO/2\ng4zmiy3zor0tRU4DkR1fl8rJSetaXopCy4RR2Y9gm3Uou/oBfnnkGID+9DzCSSKe\njrqLwRhhWpFN8YK/dzDG4WHEL75zy5en8a3UhLS+0qb6xFDXVsKr6NYJAoGAQ8jb\nQQ98/4ItiKHTTCrPJ3H0IksI1zGZFdU2ObyYRrtUpq0gLMlQG10pZCOmIydX7tbw\nA+i0vrsiorYQTkpTQkIJSrQTJSMKaVcBDy9Nxo4xf5KsKyh5+UJXle4k3T4jeuRb\nueSmpUOOSBHfKCORMouZ3KQiEQg3pPbOayuD6zMCgYBNDFzdahAIG4dBjwJvn3RQ\nxov4LtxmOnQd8qy2rJZ6YtB9y/ZF+YrTTfsIa/hTjUYILSfHPhB9aW1ixpGVvUU5\nsAzcWtURIF9IftJf/OWXiw/UB0h3gVAx+eajQN8AddssW2rnxxfNN+bDDkuTSJ5n\nk8gG7CljRrOybY52RI0M3g==\n-----END PRIVATE KEY-----\n"
    };

    const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly']
    });

    try {
        console.log("Authorizing...");
        await auth.authorize();
        console.log("SUCCESS!");
        
        const calendar = google.calendar({ version: 'v3', auth });
        const res = await calendar.calendarList.list();
        
        console.log("Available Calendars:");
        res.data.items.forEach(c => {
            console.log(`- ${c.summary} (${c.id})`);
        });
    } catch (err) {
        console.error("FAILED:", err.message);
    }
}

main();
