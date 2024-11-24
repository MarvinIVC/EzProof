document.getElementById('proofread-button').addEventListener('click', async () => {
    const inputText = document.getElementById('input-text').value;

    if (!inputText.trim()) {
        alert('Please enter some text to proofread.');
        return;
    }

    const resultContainer = document.getElementById('results');
    resultContainer.innerHTML = "<p>Analyzing text...</p>";

    try {
        const grammarResponse = await fetch("https://api.languagetool.org/v2/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                text: inputText,
                language: "en-US",
            }),
        });

        const grammarData = await grammarResponse.json();


        resultContainer.innerHTML = "";

        if (grammarData.matches.length === 0) {
            resultContainer.innerHTML += "<p>No grammar or spelling issues found!</p>";
        } else {
            grammarData.matches.forEach((match) => {

                const suggestions = match.replacements.slice(0, 3).map(r => r.value).join(", ") || "No suggestions available";
                const highlightedText = highlightIssue(inputText, match.offset, match.length);


                const issueContainer = document.createElement('div');
                issueContainer.className = "issue-container";
                issueContainer.innerHTML = `
                    <p><strong>Issue:</strong> ${match.message}</p>
                    <p><strong>Suggestion:</strong> ${suggestions}</p>
                    <p><strong>Context:</strong> ${highlightedText}</p>
                `;
                resultContainer.appendChild(issueContainer);
            });
        }


        const readabilityScore = analyzeReadability(inputText);
        resultContainer.innerHTML += `
            <div class="readability">
                <h3>Readability Analysis</h3>
                <p><strong>Score:</strong> ${readabilityScore.score.toFixed(1)}</p>
                <p><strong>Comments:</strong> ${readabilityScore.comment}</p>
            </div>
        `;
    } catch (error) {
        resultContainer.innerHTML = `<p>Error analyzing text: ${error.message}</p>`;
    }
});


function highlightIssue(text, offset, length) {
    const before = text.slice(0, offset);
    const issue = text.slice(offset, offset + length);
    const after = text.slice(offset + length);
    return `${before}<span class="highlight">${issue}</span>${after}`;
}


function analyzeReadability(text) {
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const words = text.split(/\s+/).filter(Boolean);
    const syllables = countSyllables(text);

    if (sentences.length === 0 || words.length === 0) return { score: 100, comment: "Too short or empty to analyze" }; // handle edge cases


    const score = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);


    const clippedScore = Math.max(0, score);

    let comment = "Very easy to read";
    if (clippedScore < 60) comment = "Challenging to read";
    if (clippedScore < 30) comment = "Very difficult to read";

    return { score: clippedScore, comment };
}


function countSyllables(text) {
    const syllableRegex = /[aeiouy]{1,2}/gi;
    const matches = text.match(syllableRegex);
    return matches ? matches.length : 0;
}
