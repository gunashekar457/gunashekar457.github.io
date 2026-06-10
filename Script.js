const words = [
    "Gameplay Programmer",
    "Unity Developer",
    "Unreal Engine Developer",
    "C# & C++ Programmer"
];

let wordIndex = 0;
let charIndex = 0;

const typingElement =
document.getElementById("typing");

function type()
{
    if(charIndex < words[wordIndex].length)
    {
        typingElement.textContent +=
            words[wordIndex].charAt(charIndex);

        charIndex++;

        setTimeout(type,80);
    }
    else
    {
        setTimeout(erase,1500);
    }
}

function erase()
{
    if(charIndex > 0)
    {
        typingElement.textContent =
        words[wordIndex].substring(0,charIndex-1);

        charIndex--;

        setTimeout(erase,40);
    }
    else
    {
        wordIndex++;

        if(wordIndex >= words.length)
            wordIndex = 0;

        setTimeout(type,300);
    }
}

type();