class VocalanceJS {

    static #APP_NAME = 'VocalanceJS';
    static #THROW_ERROR = 'error';

    static #THROWER = (message, type = VocalanceJS.#THROW_ERROR) => {
        switch(type) {
            case VocalanceJS.#THROW_ERROR:
                console.error(VocalanceJS.#APP_NAME+ ' ERROR: '+message);
            break;
        }
    }

    // fetch config
    static #FETCH_OPTIONS = {
        method: 'get',
        url: '',
        data: null,
        callback: null
    }

    // Content configuration informations:
    #config = {
        // app configuration
        app: {
            uuid: '',
            url: {
                getData:'http://www.kidevs.xyz/vocalance/public/api/app/projects/',
                saveUsage: 'http://www.kidevs.xyz/vocalance/public/api/app/history/save/'
            } 
        },
        // here, we store user overwritting method content
        on: {
            finish: null,
            response: null,
            ready: null,
        }
    };

    #collected = {
        project: null,
        // User's questions keys
        questionKeys : [], // [key,...]

        // Questions fetch from the url
        questions : [], // [{key: '', question: '', responseTime: '', label: ''}, ...]
        
        // User's response for each question
        responses : [] // [{key: response}, ...]
    }

    // Initiation
    constructor(uuid = null) {
        
        // Store the user's UUID
        if (uuid == null || (uuid+'').trim() == '') {
            VocalanceJS.#THROWER('AV-Key must not be null');
            return;
        }
        this.#config.app.uuid = uuid;

        // fetch Question
        let fetchOption = VocalanceJS.#FETCH_OPTIONS;
        fetchOption.url = this.#config.app.url.getData+uuid;
        fetchOption.callback = this.#callbackGettingProject;
        this.urlCaller(fetchOption);
    }


    urlCaller(config) {
        fetch(config.url)
        .then((response) => response.json())
        .then((data) => {
            if (config.callback != null) {
                let callback = config.callback;
                if ( typeof callback === 'function' ) {
                    callback(data, this);
                }
            }
        })
        .catch((error) => {
            console.log(error);
        });
    }


    /**
     * Here, we try to store projet information like:
     * - question information (key, question, response's time)
     * - question's key only
     * 
     * Calling user on Ready function
     */
    #callbackGettingProject(data, globalContext) {
        if (data !== undefined) {
            let project = data.project;

            // store project
            globalContext.#collected.project = project;

            // Check if project have question
            if ( (project.qestions).length < 1) {
                VocalanceJS.#THROWER(' No question available. Please add some question to your project to make vocal assistance work.');
                return;
            }

            (project.qestions).forEach(question => {
                // storing key
                (globalContext.#collected.questionKeys).push(question.key);
                // storing question
                (globalContext.#collected.questions).push({
                    label: question.label,
                    key: question.key, 
                    question: question.question, 
                    responseTime: question.response_time
                });
            });
            
            // Run user on ready function
            if ( typeof globalContext.#config.on.ready === 'function' ) {
                let onReadyFunction = globalContext.#config.on.ready;
                onReadyFunction(globalContext);
            }
        } 
    }


    getQuestion(index = 0) {
        return index < (this.#collected.questions).length ? this.#collected.questions[index].question : VocalanceJS.#THROWER(`Question in position ${index} not exist`);
    }


    getAllQuestions() {
        return this.#collected.questions;
    }


    getResponse(index = 0) {
        return index < (this.#collected.responses).length ? this.#collected.responses[index] : VocalanceJS.#THROWER(`Response in position ${index} not exist`);
    }


    getAllResponses() {
        return this.#collected.responses;
    }


    getProject() {
        return this.#collected.project;
    }


    #textToSpeech(text, lang, gender) {
        /*
        let voices = speechSynthesis.getVoices();;
        let currentVoice;   
        const toSay = input.value.trim();
        const utterance = new SpeechSynthesisUtterance(toSay);
        
        // setting voice
        utterance.voice = voices[this.#detectVoice(lang, gender)];

        // set lang
        utterance.lang

        // on start speaking
        utterance.addEventListener('start', () => {
            
        });

        // onfinish speaking
        utterance.addEventListener('end', () => {
        // start Listen to response
        });

        // speak now
        speechSynthesis.speak(utterance);
        */
        
    }

    #speechToText() {

    }

    #detectVoice(lang, gender) {
        let voiceIndex = 0;
        return voiceIndex;
    }


    onReady(closure) {
        if (typeof closure !== 'function') {
            VocalanceJS.#THROWER('Only a closure function is allowed here. Please refer to VocalanceJS doc');
            return;
        }
        this.#config.on.ready = closure;

        return this;
    }

    start() {
        // Save usage
        // let fetchOption = VocalanceJS.#FETCH_OPTIONS;
        // fetchOption.url = this.#config.app.url.saveUsage+this.#config.app.uuid;
        // fetchOption.callback = null;
        // this.urlCaller(fetchOption);
        
    }

    stop() {}

    goTo(step = 0) {}

    onResponse(){}

    onFinish(){};

}