import React from 'react';
import "reveal.js/dist/reveal.css";
//import "reveal.js/dist/theme/white.css";
import '../routes/home/rjs_white.css';
import Reveal from 'reveal.js';

class RevealJsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        this.startPreso = this.startPreso.bind(this);
    }
    componentDidMount() {
        this.startPreso();
    }
    startPreso () {
        let sections = localStorage.getItem('revealjsSections');
        var container = document.querySelector("#rj");
        let finalHtml = `<div class="reveal"><div class="slides">`;
        
        finalHtml = `<div style="display: flex; flex-direction: row;">
        <div class="reveal deck1" style="width: 100%; height: 100vh; margin: 10px;">
        <div class="slides">`;

        finalHtml += sections;
        finalHtml += `</div></div></div>`;
        container.innerHTML = finalHtml;
        console.log(`FinalHTML: `, finalHtml);
        //Reveal.initialize();
        let deck1 = new Reveal( document.querySelector( '.deck1' ), {
            embedded: true,
            progress: false,
            keyboardCondition: 'focused',
        } );
        deck1.initialize();

    }


    render() {

        //setTimeout(this.startPreso, 100);
        return (
            <div id="rj">
                Hi there, we'll show reveal js page here. 
            </div>
        );
    }
}

export { RevealJsPage };
