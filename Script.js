const text = [
    "Gameplay Programmer",
    "Unity Developer",
    "Unreal Engine Developer",
    "C# & C++ Programmer"
];

let i = 0;

function rotateText()
{
    document.getElementById("typing").textContent =
        text[i];

    i++;

    if(i >= text.length)
        i = 0;
}

rotateText();

setInterval(rotateText, 2000);