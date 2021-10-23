
// THIS WORKS TO INVOKE .addAudioPlayerPlayDirective() [OR .addVideoAppLaunchDirective()]
// COMES FROM DABBLE LABS -- INVOCATION = "CHARLIE TO SING"
//
// Once a Play directive is issued, Alexa closes the skill session, but ...
// Alexa remembers the last streaming skill, and will continue to send any relevant 
// streaming intents to it, even if its invocation name is not mentioned.
// It's then up to the skill to handle that as best it thinks
/******************
 * These intents include ..
 * AMAZON.CancelIntent
 * AMAZON.LoopOffIntent
 * AMAZON.LoopOnIntent
 * AMAZON.NextIntent
 * AMAZON.PauseIntent
 * AMAZON.PreviousIntent
 * AMAZON.RepeatIntent
 * AMAZON.ResumeIntent
 * AMAZON.ShuffleOffIntent
 * AMAZON.ShuffleOnIntent
 * AMAZON.StartOverIntent
 * *****************
 * AudioPlayer directives are:
 * Play
 * Stop
 * ClearQueue
*/

const Alexa = require('ask-sdk-core');
const Util = require('./util.js'); //importing the utils class reference

var song = 'any';
var songIndex = 0;
var stream;

/* 
STREAMS is an array holding stuff that tells the system about the stream URL & associated images
that array contains, as it happens, a single {..} object.
That object contains 3 properties:
  token, url, metadata.
  The metadata property is itself an object containing 4 properties:
    title, subtitle, art, backgroundImage.
      art is actually an object containing 1 property: sources.
        sources property is an array: 
          That array contains a single object containing 4 props:
            contentDescription, url, widthPixels, heightPixels.
      backgroundImage is an object containing 1 property: sources.
        The sources prop is an array with the same structure as the prop of that name under 'art'
*/
const STREAMS = [
  {
    'token': 'Charlie-Singing-0',
    // change token if have chaged metadata to avoid caching probs
    //'url': 'https://stream.zeno.fm/efe91skxn18uv.m3u',
    //'url': 'https://open.live.bbc.co.uk/mediaselector/5/select/version/2.0/mediaset/http-icy-mp3-a/vpid/bbc_radio_newcastle/format/pls.pls',
    'url': "Media/MyWay_fullChaz.mp3",
    'name': 'My Way',
    'prompt': 'My Way',
    'prompt2': ' the song, MY WAY. This is the song he sung at Jean\'s one hundredth birthday party. ',
    'metadata': {
        'title': 'Charlie singing\nMy Way',  // this is spoken
        'subtitle': 'for Jean Macdonald\'s 100th',
        'art': {
             'sources': [
             {
                'contentDescription': 'Charlie singing',
                //'url': 'https://faproductions.uk/wp-content/uploads/2021/09/ChazSinging_512.jpg',
                'url': Util.getS3PreSignedUrl('Media/ChazSinging_512.jpg'),
                'widthPixels': 512,
                'heightPixels': 512,
             },
                        ],
               },
        'backgroundImage': {
                'sources': [
                {
                    'contentDescription': 'Charlie singing',
                    'url': Util.getS3PreSignedUrl('Media/100thFamilyOnBeach_1200x800.jpg'),
                    'widthPixels': 1200,
                    'heightPixels': 800,
                },
                            ],
                          },
                }, // end of metadata item
  },
  {
      'token': 'Charlie-Singing-1',
      'url': "Media/SmokeGetsInYourEyes_Chaz.m4a",
      'name': 'Smoke Gets In Your Eyes',
      'prompt': 'smoke',
      'prompt2': ' the old favourite, SMOKE GETS IN YOUR EYES. ',
      'metadata': {
        'title': 'Charlie singing\nSmoke Gets in Your Eyes',  // this is spoken
        'subtitle': 'for Jean Macdonald\'s 100th',
        'art': {
             'sources': [
             {
                 'contentDescription': 'Charlie singing',
                'url': Util.getS3PreSignedUrl('Media/CharlieHead-130420.jpg'),
                'widthPixels': 512,
                'heightPixels': 512,
             },
                        ],
               },
        'backgroundImage': {
                'sources': [
                {
                    'contentDescription': 'Charlie singing',
                    'url': Util.getS3PreSignedUrl('Media/CharlieLeslieJulieJeanAtAlexWedding.jpeg'),
                    //'widthPixels': 1200,
                    //'heightPixels': 800,
                },
                            ],
                          },
      }
  }
];

/********************
 * INTENT HANDLERS
 * ******************
*/

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest'
            || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StartOverIntent';
            // "Alexa, start again" OR "Alexa, restart"
    },
    handle(handlerInput) {
        console.log('CONSOLE LOG: inside LaunchRequestHandler');
        let speakOutput = `OK. I have a choice of songs for you, all sung by Charlie. 
        You can choose `;
        for(let i=0; i<STREAMS.length; i++) speakOutput += `${STREAMS[i].prompt2}, or `;
        speakOutput += `if you don't mind which song he sings, just say, any song. 
            That's just, <emphasis level="strong">any song</emphasis>.<break time = "0.3s"/>
            OK, say now what song would you like to hear. `;
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('You can just say, <emphasis level="strong">any song</emphasis>. ')
            .getResponse();
    }
};

const PlayStreamIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      &&  ( handlerInput.requestEnvelope.request.intent.name === 'PlayStreamIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ResumeIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.LoopOnIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NextIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PreviousIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ShuffleOnIntent'
       // || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StartOverIntent'
      ); 
  },
  handle(handlerInput) {
    console.log('CONSOLE LOG: inside PlayStreamIntentHandler');
    
    let song_chosen = handlerInput.requestEnvelope.request.intent.slots.song.resolutions.resolutionsPerAuthority[0].values[0].value;
    // OR  handlerInput.requestEnvelope.request.intent.slots.SLOTNAME.value;
    console.log('CONSOLE LOG: song_chosen = ', song_chosen, '\nsong_chosen.name = ', song_chosen.name);
    // see results on CloudWatch Ireland after running with Device Log ticked on Test tab (console.log() output is preceded by INFO
    
    song = song_chosen.name;
    
    if (song === 'any') {
        songIndex = Math.floor(Math.random() * STREAMS.length); //The maximum (STREAMS.length) is exclusive and the minimum (0) is inclusive;
        console.log('CONSOLE LOG: any song, songIndex = ', song, songIndex);
    }
    else {
    // find STREAMS[] array index where property 'name' matches the chosen song slot name (NOT slot type)
    songIndex = STREAMS.findIndex((sng) => sng.name === song);
    console.log('CONSOLE LOG: index in STREAMS.findIndex((sng)=> sng.name === song IS ', STREAMS.findIndex((sng) => sng.name === song));
    }
    
    stream = STREAMS[songIndex];
    console.log('CONSOLE LOG: stream.url, stream.token = \n', stream.url,'\n', stream.token);
    console.log('CONSOLE LOG: stream.metadata.art.sources[0].url = \n', stream.metadata.art.sources[0].url);
    console.log('CONSOLE LOG: stream.metadata.backgroundImage.sources[0].url = \n', stream.metadata.backgroundImage.sources[0].url);
    
    handlerInput.responseBuilder
      .speak(`here is ${stream.metadata.title}`)
      .addAudioPlayerPlayDirective('REPLACE_ALL', Util.getS3PreSignedUrl(stream.url), stream.token, 0, null, stream.metadata);
      //.addAudioPlayerPlayDirective('REPLACE_ALL', stream.url, stream.token, 0, null, stream.metadata);
      // (PlayBehavior, url, token, offsetInMilliseconds, expectedPreviousToken, metadata)
      // PlayBehavior = REPLACE_ALL or ENQUEUE
      // url = trusted SSL AAC/MP$, MP3, HLS, PLS, M3U (16 to 384 kbps) [PLS and M3U used for radio streams]
      // offsetInMillseconds = time in stream where playback should start
      // expectedPreviousToken (OPTIONAL) allowed only when ENQUEUE: to stop races between simult request for new track and change tracks
      // metadata (OPTIONAL) to display stuff on screen devices
    return handlerInput.responseBuilder
      .getResponse();
  },
};

/*
// These two handlers cause Stop and Exit to be ignored!! (replaced by half sec pause)
const PauseIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PauseIntent';
    },
    async handle(handlerInput) {
        return handlerInput.responseBuilder
        //.speak()
        .getResponse();
    }
};


const ResumeIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.ResumeIntent');
    },
    async handle(handlerInput) {
        const url = Util.getS3PreSignedUrl(stream.url);
        const AudioPlayer = handlerInput.requestEnvelope.context.AudioPlayer;
        const token = AudioPlayer.token;
        const offset = AudioPlayer.offsetInMilliseconds;
        console.log('CONSOLE_LOG: offsetInMilliseconds = ', offset);
        return handlerInput.responseBuilder
            .addAudioPlayerPlayDirective('REPLACE_ALL', url, token, offset, null)
            //.speak(' ')
            .getResponse();
  }
};
*/

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'This skill plays an audio stream when it is started. It does not have any additional functionality.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const AboutIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AboutIntent';
  },
  handle(handlerInput) {
    const speechText = 'This is an audio streaming skill that was built with a free template from skill templates dot com';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PauseIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.LoopOffIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ShuffleOffIntent'
      );
  },
  handle(handlerInput) {
    handlerInput.responseBuilder
      .addAudioPlayerClearQueueDirective('CLEAR_ALL')
      .addAudioPlayerStopDirective();

    return handlerInput.responseBuilder
      .getResponse();
  },
};

const PlaybackStoppedIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'PlaybackController.PauseCommandIssued'
      || handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackStopped';
  },
  handle(handlerInput) {
    handlerInput.responseBuilder
      .addAudioPlayerClearQueueDirective('CLEAR_ALL')
      .addAudioPlayerStopDirective();

    return handlerInput.responseBuilder
      .getResponse();
  },
};

const PlaybackStartedIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackStarted';
  },
  handle(handlerInput) {
    handlerInput.responseBuilder
      .addAudioPlayerClearQueueDirective('CLEAR_ENQUEUED');

    return handlerInput.responseBuilder
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder
      .getResponse();
  },
};

const ExceptionEncounteredRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'System.ExceptionEncountered';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return true;
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(handlerInput.requestEnvelope.request.type);
    return handlerInput.responseBuilder
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    PlayStreamIntentHandler,
    PlaybackStartedIntentHandler,
    //PauseIntentHandler,
    //ResumeIntentHandler,
    CancelAndStopIntentHandler,
    PlaybackStoppedIntentHandler,
    AboutIntentHandler,
    HelpIntentHandler,
    ExceptionEncounteredRequestHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
