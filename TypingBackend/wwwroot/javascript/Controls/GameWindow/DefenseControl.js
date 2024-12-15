import { GameTimer } from "./GameTimer.js";

export class DefenseControl extends HTMLElement
{
    // ELEMENTS.
    #phraseDisplaySpan = null;
    #phraseTextbox = null;
    #defenseTimer = null;

    // PRIVATE MEMBERS.
    #gracePeriodInSeconds = 5;
    #timeToTypePhraseInSeconds = 10;
    #typingStartDateTime = null;
    #defensePromiseResolver = null;
    #currentChunk = null;

    // CONSTRUCTOR.
    constructor()
    {
        super();
    }

    // Called when connected.
    connectedCallback()
    {
        // CREATE THE SHADOW DOM.
        const shadowRoot = this.attachShadow({ mode: "open" });

        // SET THE INNER HTML.
        shadowRoot.innerHTML = `
<div id="Container">
    <span style="font-size: 20px;">Defend! Type in the phrase.</span>
    <span id="PhraseDisplaySpan"></span>
    <div>
        <game-timer id="GameTimer"></game-timer><input id="PhraseTextbox" type="text"></input>
    </div>
</div>
        `;
        this.#phraseDisplaySpan = shadowRoot.getElementById("PhraseDisplaySpan");
        this.#defenseTimer = shadowRoot.getElementById("GameTimer");
        this.#phraseTextbox = shadowRoot.getElementById("PhraseTextbox");

        // SET THE STYLE.
        const style = document.createElement("style");
        style.textContent = `
        #Container
        {
            display: flex;
            flex-direction: column;
            align-items: center;
            row-gap: 10px;
        }

        #PhraseDisplaySpan > span
        {
            font-size: 24px;
        }

        #PhraseTextbox
        {
            height: 20px;
            font-size: 18px;
        }`;
        shadowRoot.appendChild(style);
    }

    // PUBLIC FUNCTIONS.
    // Opens the control.
    async Open(phrase)
    {
        // HANDLE THE USER TYPING.
        this.#phraseTextbox.addEventListener("input", () =>
        {
            // End the grace period.
            const userStartedTyping = this.#typingStartDateTime != null;
            if (!userStartedTyping)
            {
                this.#defenseTimer.EndTimer();
            }

            // Move to the next word if the chunk was entered correctly.
            const currentChunkText = this.#currentChunk.innerText;
            const inputText = this.#phraseTextbox.value;
            const wordIsCorrect = (currentChunkText == inputText)
            if (wordIsCorrect)
            {
                this.#currentChunk.style.textDecoration = "none";
                this.#phraseTextbox.value = "";
                this.#currentChunk = this.#currentChunk.nextElementSibling;

                // Check if the full phrase was entered.
                const fullPhraseEntered = this.#currentChunk === null;
                if (fullPhraseEntered)
                {
                    // End the typing timer.
                    this.#defenseTimer.EndTimer();
                }
                else
                {
                    this.#currentChunk.style.textDecoration = "underline";
                }
            }
        });

        // ADD THE WORDS TO THE TYPE DISPLAY.
        const phraseChunks = phrase.split(" ");
        phraseChunks.forEach((chunk, index) =>
        {
            // CREATE THE SPAN FOR EACH CHUNK.
            const chunkSpan = document.createElement("span");
            this.#phraseDisplaySpan.insertAdjacentElement("beforeend", chunkSpan);
            chunkSpan.innerText = chunk;
            
            // Add a space to the end of the chunk if it is not the last chunk.
            const chunkIsLastInPhrase = (index == phraseChunks.length - 1);
            if (!chunkIsLastInPhrase)
            {
                chunkSpan.innerText += " ";
            }
        });
        this.#currentChunk = this.#phraseDisplaySpan.children[0];
        this.#currentChunk.style.textDecoration = "underline";

        // SHOW THE CONTROL.
        this.style.display = "block";

        // START THE GRACE PERIOD TIMER.
        this.#defenseTimer.StartTimer(this.#gracePeriodInSeconds).then(() =>
        {
            this.#startTypingTimer();
        });

        // FOCUS ON THE TEXTBOX.
        this.#phraseTextbox.focus();
        
        // CREATE A PROMISE TO BE RESOLVED WHEN THE TIME HAS ENDED
        // OR THE PHRASE WAS COMPLETED.
        const defensePromise = new Promise((resolve) =>
            {
                this.#defensePromiseResolver = resolve;
            });
        return defensePromise;
    }

    // Closes the control.
    #close()
    {
        // RESET THE CONTROL.
        this.#gracePeriodInSeconds = 5;
        this.#timeToTypePhraseInSeconds = 10;
        this.#typingStartDateTime = null;
        this.#defensePromiseResolver = null;
        this.#phraseTextbox.value = "";
        this.#currentChunk = null;
        this.#phraseDisplaySpan.innerHTML = "";

        // HIDE THE CONTROL.
        this.style.display = "none";
    }

    // PRIVATE FUNCITONS.
    // Starts the typing timer.
    #startTypingTimer()
    {
        // Check if the typing timer was already started.
        const typingTimerStarted = this.#typingStartDateTime != null;
        if (!typingTimerStarted)
        {
            // Start the timer.
            this.#typingStartDateTime = new Date();
            this.#defenseTimer.StartTimer(this.#timeToTypePhraseInSeconds).then(() =>
            {
                const typingEndDateTime = new Date();
                const typeTimeInSeconds = (typingEndDateTime - this.#typingStartDateTime) / 1000;
                this.#defensePromiseResolver({ time: typeTimeInSeconds });
                this.#close();
            });
        }
    }
}
customElements.define("defense-control", DefenseControl);