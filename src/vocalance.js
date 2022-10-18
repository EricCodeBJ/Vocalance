class VocalanceJS {

    static #STATUT_PAUSE = '';
    static #STATUT_BOT_SPEAK = 'v-w-soundbar-animated-boot';
    static #STATUT_USER_SPEAK = 'v-w-soundbar-animated-user';
    static #STATUT_FINISH = 'v-w-soundbar-animated-success';
    static #STATUT_ERROR = 'v-w-soundbar-animated-error';

    static #ACTOR_BOOT = 'bot';
    static #ACTOR_USER = 'user';

    static #APP_NAME = 'VocalanceJS';
    static #THROW_ERROR = 'error';
    static #HTMLVocalanceJSWidget = `<div class="v-w-bloc">
      <!-- Section Progression Bar -->
      <div class="v-w-bloc-progess">
        <div class="v-w-bloc-progession-bar"></div>
      </div>
      <div class="v-w-bloc-content">
        <h5 class="title">
          <img
            alt="icon-boot"
            src="https://www.kidevs.xyz/vocalance/lib/assets/icon/chatbox.png"
          />
          Vocalance
        </h5>
        <!-- Section illustration -->
        <!-- Section soundBar -->
        <div class="v-w-soundbar">
          <img
            class="vw-chat-badge-success vocalance-widget-hide"
            alt="icon-statut"
            src="https://www.kidevs.xyz/vocalance/lib/assets/icon/check.png"
          />
          <div class="v-w-box v-w-box1"></div>
          <div class="v-w-box v-w-box2"></div>
          <div class="v-w-box v-w-box3"></div>
          <div class="v-w-box v-w-box4"></div>
          <div class="v-w-box v-w-box5"></div>
          <div class="v-w-box v-w-box1"></div>
          <div class="v-w-box v-w-box2"></div>
          <div class="v-w-box v-w-box3"></div>
          <div class="v-w-box v-w-box4"></div>
          <div class="v-w-box v-w-box5"></div>
          <div class="v-w-box v-w-box4"></div>
          <div class="v-w-box v-w-box5"></div>
          <div class="v-w-box v-w-box1"></div>
          <div class="v-w-box v-w-box4"></div>
          <div class="v-w-box v-w-box5"></div>
          <div class="v-w-box v-w-box1"></div>
          <div class="v-w-box v-w-box2"></div>
          <div class="v-w-box v-w-box3"></div>
          <div class="v-w-box v-w-box4"></div>
          <div class="v-w-box v-w-box5"></div>
          <div class="v-w-box v-w-box4"></div>
          <div class="v-w-box v-w-box5"></div>
          <div class="v-w-box v-w-box1"></div>
          <div class="v-w-box v-w-box2"></div>
          <div class="v-w-box v-w-box3"></div>
          <div class="v-w-box v-w-box4"></div>
          <div class="v-w-box v-w-box5"></div>
          <div class="v-w-box v-w-box1"></div>
          <div class="v-w-box v-w-box2"></div>
          <div class="v-w-box v-w-box3"></div>
          <div class="v-w-box v-w-box2"></div>
          <div class="v-w-box v-w-box3"></div>
        </div>
        <!-- Section Chat question -->
        <div class="v-w-chat-bloc"></div>
      </div>
    </div>`;

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

    #step = -1;

    #NotificationSound = {
        detectionStart: new Audio('https://www.kidevs.xyz/vocalance/lib/assets/sound/record-on.mp3'),
        detectionEnd: new Audio('https://www.kidevs.xyz/vocalance/lib/assets/sound/record-off.mp3'),
    }

    // Content configuration informations:
    #config = {
        // app configuration
        app: {
            uuid: '',
            url: {
                getData:'https://www.kidevs.xyz/vocalance/public/api/app/projects/',
                saveUsage: 'https://www.kidevs.xyz/vocalance/public/api/app/history/save/'
            },
            voice: -1,
            voices: '',
            voiceIndex: -1
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
        responses : [] // [key: response, ...]
    }


    // Initiation
    constructor() {
        let globalContext = this;

        // Load Voices
        this.#asyncSpeechDetect();

        // Check for vocalance Widget available 
        let widget = document.getElementsByTagName("vocalance-widget");
        if ( widget.length < 1 ) {
            VocalanceJS.#THROWER('VocalanceJS\'s tag not found. Please read carefully the doc');
            return;
        }

        // Check & Store the user's UUID
        let uuid = widget[0].getAttribute("av-key");
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
        fetch(config.url, {
            'Content-type': 'application/json; charset=utf-8'
        })
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

            // Detect voice
            globalContext.#detectVoice(project.language, project.gender);
            
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

    getStep() {
        return this.#step;
    }

    setStep(step) {
       this.#step = step;
    }

    #textToSpeech(message, callback = null) {
        let globalContext = this;
        this.#chatCreate("boot"+this.#step, VocalanceJS.#ACTOR_BOOT, "...");
        this.#updateSoundBarUI(VocalanceJS.#STATUT_PAUSE);

        const utterance = new SpeechSynthesisUtterance(message);
        
        // Detect voice 
        if (this.#config.app.voice == -1) {
            this.#config.app.voice = this.#config.app.voices[this.#config.app.voiceIndex];
        }

        utterance.voice =  this.#config.app.voice;
        // on start speaking
        utterance.addEventListener('start', () => {
            this.#updateSoundBarUI(VocalanceJS.#STATUT_BOT_SPEAK);
            globalContext.#chatEdit("boot"+globalContext.#step, message);
        });
        // onfinish speaking
        utterance.addEventListener('end', () => {
            this.#updateSoundBarUI(VocalanceJS.#STATUT_PAUSE);

            let getCallback = callback;
            if (typeof getCallback === 'function') {
                getCallback();
            } else {
                this.#speechToText();
            }
        });

        // speak now
        speechSynthesis.speak(utterance);
        
    }

    #speechToText() {
        let globalContext = this;

        // Start detection sound
        (this.#NotificationSound.detectionStart).play();

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let recognition = new SpeechRecognition();

        recognition.onstart = () => {
            
        };
        
        recognition.onresult = (result) => {

            // Start detection sound
            recognition.stop();
            globalContext.#NotificationSound.detectionEnd.play();

            let responseKey = globalContext.#collected.questionKeys[globalContext.#step];
            let userWords = result.results[0][0].transcript;

            this.#chatCreate("user"+this.#step, VocalanceJS.#ACTOR_USER, userWords);
            globalContext.#collected.responses[responseKey] = userWords; 

            // continue process
            setTimeout(() => {
                globalContext.#step++;
                let responseCallback = globalContext.#config.on.response;
                if ( (typeof responseCallback === 'function' && responseCallback(globalContext.#step - 1, userWords)) 
                    || responseCallback == null) {
                    if ((globalContext.#collected.questions).length > globalContext.#step) {
                        this.#updateProgressBarUI(parseInt((globalContext.#step * 100) / (globalContext.#collected.questions).length));
                        globalContext.#textToSpeech(globalContext.getQuestion(globalContext.#step));
                    } else {
                        globalContext.finishProcess();
                    }
                }
                
            }, 300);
        };

        recognition.onerror = (event) => {
            console.log(event.error);
            globalContext.speechToText();
        };

        recognition.start();        
    }

    #detectVoice(lang, gender) {
        let globalContext = this;
        let voiceIndex = 0;
        
        if (lang == 'fr') {
            if (gender == 'm') {
                voiceIndex = 2;
            } else {
                voiceIndex = 1;
            }
        } else if (lang == "eng") {
            if (gender == 'm') {
                voiceIndex = 6;
            } else {
                voiceIndex = 5;
            }
        }

        globalContext.#config.app.voiceIndex = voiceIndex;
    }

    #asyncSpeechDetect() {
        setTimeout(() => {
            let availableVoices = speechSynthesis.getVoices();
            if ( (availableVoices).length > 0 ) {
                this.#config.app.voices = availableVoices;
            } else {
                this.#asyncSpeechDetect();
            }
        }, 300);
        
    }

    onReady(closure) {
        if (typeof closure !== 'function') {
            VocalanceJS.#THROWER('Only a closure function is allowed here. Please refer to VocalanceJS doc');
            return;
        }
        this.#config.on.ready = closure;
    }

    onFinish(closure) {
        if (typeof closure !== 'function') {
            VocalanceJS.#THROWER('Only a closure function is allowed here. Please refer to VocalanceJS doc');
            return;
        }
        this.#config.on.finish = closure;
    }

    // Store on finish closure
    start() {
        // Save usage
        let fetchOption = VocalanceJS.#FETCH_OPTIONS;
        fetchOption.url = this.#config.app.url.saveUsage+this.#config.app.uuid;
        fetchOption.callback = null;
        this.urlCaller(fetchOption);

       // showing this
        let newWidget = document.getElementsByTagName("vocalance-widget")[0];
        newWidget.innerHTML = '';
        newWidget.innerHTML = VocalanceJS.#HTMLVocalanceJSWidget;
        newWidget.classList.remove('vocalance-widget-show', 'vocalance-widget-hide');
        newWidget.classList.add('vocalance-widget-show');

        // Start Talking
        this.#startProcess();

    }

    #startProcess() {
        this.#updateSoundBarUI(VocalanceJS.#STATUT_PAUSE);
        this.#updateProgressBarUI(0);

        // Check for intro message
        if ( this.#collected.project.intro_message != null 
            && this.#collected.project.intro_message != 'null'
            && this.#collected.project.intro_message != '' ) {
            this.#textToSpeech(this.#collected.project.intro_message, () => {
                this.#step = 0;
                this.#textToSpeech(this.#collected.questions[this.#step]["question"]);
            });
        } else {
            this.#step = 0;
            this.#textToSpeech(this.#collected.questions[this.#step]["question"]);
        }
        
    }

    stop() {
        let currentWidget = document.getElementsByTagName("vocalance-widget");
        if (currentWidget.length > 0) {
            currentWidget[0].classList.replace('vocalance-widget-show', 'vocalance-widget-hide');
            setTimeout(() => {
                currentWidget[0].innerHTML = '';
            }, 1000);
        }
    }

    repeat() {
        this.#step--;
    }

    goTo(step = 0) {
        this.#step = step;
    }

    onResponse (closure) {
        if (typeof closure !== 'function') {
            VocalanceJS.#THROWER('Only a closure function is allowed here. Please refer to VocalanceJS doc');
            return;
        }
        this.#config.on.response = closure;
    }


    finishProcess(){
        let globalContext = this;
        this.#updateSoundBarUI(VocalanceJS.#STATUT_FINISH);
        this.#updateProgressBarUI(100);

        // Check for outro message
        if ( this.#collected.project.outro_message != null 
            && this.#collected.project.outro_message != 'null'
            && this.#collected.project.outro_message != '') {
            this.#textToSpeech(this.#collected.project.outro_message, () => {
                globalContext.#callRealFinishMethod();
            });
        } else {
            globalContext.#callRealFinishMethod();
        }
    };

    #callRealFinishMethod() {
        this.#updateSoundBarUI(VocalanceJS.#STATUT_FINISH);
        let globalContext = this;
        // if user set finish méthod
        if (globalContext.#config.on.finish != null) {
            let callback = globalContext.#config.on.finish;
            callback(globalContext.#collected.responses);
        }

        setTimeout(() => {
            globalContext.stop();
        }, 5000);
    }


    #updateProgressBarUI(progress) {
        document.querySelector("vocalance-widget .v-w-bloc-progession-bar").style.width = progress+"%";
    }

    #updateSoundBarUI(statut = VocalanceJS.#STATUT_PAUSE) {
        // remove All statut class
        let soundBar = document.querySelector("vocalance-widget .v-w-soundbar");
        soundBar.classList.remove(VocalanceJS.#STATUT_BOT_SPEAK, VocalanceJS.#STATUT_USER_SPEAK, VocalanceJS.#STATUT_FINISH, VocalanceJS.#STATUT_ERROR);

        // add target statut class
        if (statut != VocalanceJS.#STATUT_PAUSE) {
            soundBar.classList.add(statut);

            if ( statut == VocalanceJS.#STATUT_FINISH ) {
                let successImg = document.querySelector("vocalance-widget img.vw-chat-badge-success");
                successImg.classList.remove("vocalance-widget-hide", "vocalance-widget-show");
                successImg.classList.add("vocalance-widget-show");
            }
        }
    }

    
    // Chat Method
    #chatCreate(reference, actor, message) {
        let newChatMessage;
        let chatBloc = document.querySelector("vocalance-widget .v-w-chat-bloc");

        if (actor == VocalanceJS.#ACTOR_BOOT) {
            newChatMessage = `<div class="v-w-question-bloc" data-reference='${reference}'>
                                <p>${message}</p>
                            </div>`;
        } else if ( actor == VocalanceJS.#ACTOR_USER ) {
            newChatMessage = `<div class="v-w-reponse-bloc" data-reference='${reference}'>
                                <p>${message}</p>
                            </div>`;
        }

        chatBloc.innerHTML += newChatMessage; 
        chatBloc.scrollTop = chatBloc.scrollHeight;
    }

    #chatEdit(reference, message) {
        let targetchatMessage = document.querySelector(`vocalance-widget .v-w-chat-bloc > div[data-reference='${reference}'] p`);
        let chatBloc = document.querySelector("vocalance-widget .v-w-chat-bloc");
        targetchatMessage.textContent = message;
        
        chatBloc.scrollTop = chatBloc.scrollHeight;
    }

    #chatRemove(reference) {
        let targetchatMessage = document.querySelector(`vocalance-widget .v-w-chat-bloc[data-reference='${reference}']`);
        targetchatMessage.remove;
    }

    #chatRemoveAll() {
        document.querySelector("vocalance-widget .v-w-chat-bloc").innerHTML = '';
    }
}