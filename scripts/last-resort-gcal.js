const { google } = require('googleapis');

async function main() {
    const privateKey = "-----BEGIN PRIVATE KEY-----\n" +
"MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCtlzApuZnvrfWI\n" +
"w8fU3KP/XDqogRTchf9fPQk/nQ4IR841SgTg8d2BmNCqZwro12PlRTjS9hV9EZp3\n" +
"48rDB3F9wgd2XOfvhClTxeTrW9VIKRnYLGBHqVpsUjNQfnOR5kNcwENl+274u61t\n" +
"ONTOatf19Yfg1Ubb/NDnML4wg+egBajrWmZJIkzcOwyxzgyiIjuQg6NUKl6o+zzu\n" +
"5rqWl8r7YqDQzZHGOaeH+PmD0bWwJr+EHMbF3wDmzZ23DHfSBRjnb0fg8+Lb9to0\n" +
"FeB9OWs/VNe0qsusTH2w1BFucu/STU8as+7E/vYG2/pcQIetEiOHztHQhRyhRh8X\n" +
"m3wNSnDPAgMBAAECggEAJ8L3Nb99KqDSmnqZ1cCaUf4qs3kpsZ+B0KtW6HrNgYkN\n" +
"CzjCqFHOVoaN2VJT9eSMTbJO40eZwXWcR7TmN0kHrnIYqnx6ZesEWlt8ZYq57lb3\n" +
"nxAPaI9//RcuIVHo6d6NiL6ccaQowL4oxndCEMinYAM82SgIgQniE00ffcJZuIkF5\n" +
"BOvKCVa8++VUWXlj2o1oYaw4XypiO0bqG8sAfRfvyfYPQSx8+vuZ4el4TZoA3nML\nxCvUsgBaQgDOaawZNzPTE5KBjxAFLtBTIENR6HJbQBqcPUjET9BFBX8bqHQ+GO9f\n" +
"DVAi7YEIBxRfPzdhSEPI2PxZj5+E0KNgo95N1MCeeQKBgQDYvn7tylJI8eqm14+u\n" +
"Sb4mWcwBhB8eHn42Tx8C3T7Wk5Q0Nxm7TDDJj4HNkGG2V7OoHVjppX/aWCIrKR8v\ndstvRodVQKFPbZhKuyk5rRNJsJn0YleXqhb28pbLHG7hK9JFkHfeBQE5VDxiu9ME\n" +
"nnWV0dzGttXfEc1zX0V0l/Dh0GQKBgQDNB9iDOnlgpoMcbn60xhv7PWAAXkZr2rbq\njxUyJD/LTK9omOwjOhUQDFgP8G5K5vn276tv0Ndoev0giReNSCZuD+Xfnm2iwbFu\n" +
"8x1Eu7s10WC6cifKpnE72QUSaq1SYCkhC5MLDTpCf5M/mmFPZRhIFQku6wlP9PLv\n" +
"PVNPB/bpJwKBgAw09lsYGPhIv6lz3IC5YH8ycX3oXgRJPVx7qkh0A3T8TM2ACO/2\ng4zmiy3zor0tRU4DkR1fl8rJSetaXopCy4RR2Y9gm3Uou/oBfnnkGID+9DzCSSKe\njrqLwRhhWpFN8YK/dzDG4WHEL75zy5en8a3UhLS+0qb6xFDXVsKr6NYJAoGAQ8jb\n" +
"QQ98/4ItiKHTTCrPJ3H0IksI1zGZFdU2ObyYRrtUpq0gLMlQG10pZCOmIydX7tbw\nA+i0vrsiorYQTkpTQkIJSrQTJSMKaVcBDy9Nxo4xf5KsKyh5+UJXle4k3T4jeuRb\nueSmpUOOSBHfKCORMouZ3KQiEQg3pPbOayuD6zMCgYBNDFzdahAIG4dBjwJvn3RQ\nxov4LtxmOnQd8qy2rJZ6YtB9y/ZF+YrTTfsIa/hTjUYILSfHPhB9aW1ixpGVvUU5\nsAzcWtURIF9IftJf/OWXiw/UB0h3gVAx+eajQN8AddssW2rnxxfNN+bDDkuTSJ5n\nk8gG7CljRrOybY52RI0M3g==\n" +
"-----END PRIVATE KEY-----\n";

    const auth = new google.auth.JWT({
        email: "dna-crm-calendar@dna-crm-489518.iam.gserviceaccount.com",
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/calendar.readonly"]
    });

    const calendar = google.calendar({ version: "v3", auth });
    
    try {
        console.log("Listing calendars...");
        // Explicitly authorize first
        await auth.authorize();
        console.log("Authorized!");
        const res = await calendar.calendarList.list();
        res.data.items.forEach(c => {
            console.log(`- ${c.summary}: ${c.id}`);
        });
    } catch (e) {
        console.error("Failed:", e.message);
        if (e.response && e.response.data) {
            console.error("Response:", JSON.stringify(e.response.data, null, 2));
        }
    }
}

main();
