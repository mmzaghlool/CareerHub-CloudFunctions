const functions = require('firebase-functions');
const https = require('https');

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


// send onesignal notification for android project
const sendOneSignal = function (data) {
    console.log("signal send start");
    const headers = {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic NGNiNmZiMmMtMWU4Ni00Y2MxLWI1ZGMtNGQ0MzYyMGQ1ZTJh`
    };

    console.log('sendOneSignal data :', data);

    const options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers
    };

    const req = https.request(options, function (res) {
        res.on("data", function (data) {
            console.log("sendOneSignal Response:", data);
        });
    });

    req.on("error", function (e) {
        console.log("sendOneSignal ERROR:", e);
    });

    req.write(JSON.stringify(data));
    req.end();
};

exports.sendNotification = functions.database.ref('/notification/{notificationKey}').onCreate((event) => {
    // Grab the current value of what was written to the Realtime Database.
    const subject = event.val();
    console.log('subject', subject);

    const { receiverUID, senderUID, title, body, image, sendTime } = subject;

    const payload = {
        data: {
            // id: subject.id,
            title,
            senderUID,
            receiverUID,
            body,
            icon: image,
            // sound: 'default',
            // clickAction: 'fcm.ACTION.HELLO',
            type: 'Notification',
            content_available: 'true'
        }
    };

    admin.database().ref(`tokens/${receiverUID}`).once('value', snap => {
        if (snap.exists()) {
            let tokensObj = snap.val()
            console.log('tokens Notif', tokens)
            const tokens = Object.values(tokensObj);


            // send onesignal notification
            sendOneSignal(
                Object.assign(
                    {
                        app_id: "35f5da96-5e74-41f7-a388-388e44198b4c",
                        contents: { en: `${body}` },
                        include_player_ids: tokens,
                        small_icon: "ic_stat_onesignal_default",
                        android_led_color: 'FF0000FF',
                        android_visibility: 1
                    },
                    payload
                )
            );

        }
    });
});


exports.indexUsersInElasticSearch = functions.database.ref('/users/{uid}').onCreate((event) => {
    // Grab the current value of what was written to the Realtime Database.
    const subject = event.val();
    const uid = event.key;
    console.log('subject', subject);
    console.log('uid', uid);

    const { firstName, lastName, phoneNumber, email } = subject;

    fetch(`18.222.72.221:9200/users/user/${uid}`, {

        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firstName,
            lastName,
            email,
            phoneNumber
        })
    })
    .then(res => res.json())
    .then(res => {
        console.log("indexUsersInElasticSearch res", res);
    })
    .catch(err => {
        console.log("indexUsersInElasticSearch err", err);

    })
});


// exports.scheduledFunction = functions.pubsub.schedule('every 2 minutes').onRun(async (context) => {

//     await admin.database().ref('/callRequests/scheduler').remove();
//     await admin.database().ref('/notificationRequests/scheduler').remove();

//     console.log('This will be run every 2 minutes !');
//     admin.database().ref('/callRequests/scheduler').update({ scheduler: true });
//     admin.database().ref('/notificationRequests/scheduler').update({ scheduler: true });
// });