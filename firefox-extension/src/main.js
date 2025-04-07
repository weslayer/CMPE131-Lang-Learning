


// function getAllImages() {
//     const images = document.getElementsByTagName("img");
//     for(let i = 0; i < images.length; i ++) {
        
//     }
// }

function getText() {
    // console.log(document.body.textContent);

    const tags = [
        "script", "style"
    ];

    /**
     * 
     * @param {HTMLElement} node 
     */
    const processNode = (node) =>{

        const l = node.tagName;
        if(l){
            const a = l.toLowerCase();
            if(!tags.some((i) => a === i )) {
                // console.log(node);
                // console.log(node.text);
                fetch(`http://localhost:8000/tokenize/cn?q=${encodeURIComponent(node.text)}`).then(res => res.json()).then((value) => {
                    const tokens = value.res;
                    
                    tokens.reverse().forEach((token) => {
                        const range = new Range();
                        range.setStart(node, i);
                        range.setEnd(node, i + token.token.length);
                        const span = document.createElement("span");
                        span.textContent = token.token;

                    });
                });
            }
        }
        node.childNodes.forEach(processNode);

    }

    processNode(document.body);

}
setTimeout(() => {
    getText();
}, 10000)

// getAllImages();
// setInterval(() => {
//     getAllImages();
// }, 1000);