document.addEventListener('DOMContentLoaded', () => {
    const animation = document.getElementById('animation');
    const instructionText = document.getElementById('instruction-text');
    const controlButton = document.getElementById('control-button');
    const doneButton = document.getElementById('done-button');
    const modal = document.getElementById('modal');
    const closeButton = document.getElementById('close-button');

    let isAnimating = false;
    let isDone = true;

    controlButton.addEventListener('click', () => {
        if (isDone) {
            openModal();
            return;
        }

        if (isAnimating) {
            stopAnimation();
        } else {
            startAnimation();
        }
    });

    doneButton.addEventListener('click', () => {
        if (!isDone && !isAnimating) {
            alert('You have successfully completed the exercise!');
            reset();
        }
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
        controlButton.disabled = false;
        controlButton.innerText = 'Play';
        instructionText.innerText = "Tap Play to begin and follow the soothing rhythm of the circle.";
        isDone = false;
    });

    function openModal() {
        modal.style.display = 'block';
        controlButton.disabled = true;
    }

    function startAnimation() {
        isAnimating = true;
        controlButton.innerText = 'Pause';
        instructionText.innerText = 'Inhale gently through your nose for 4 counts, expanding your belly...';
        animateCircle('expand');
    }

    function stopAnimation() {
        isAnimating = false;
        controlButton.innerText = 'Play';
        animation.style.width = '50px';
        animation.style.height = '50px';
        animation.style.backgroundColor = '#0284c7';
        instructionText.innerText = "Tap Start to begin your calming belly breathing session.";
    }

    function animateCircle(action) {
        if (isAnimating) {
            if (action === 'expand') {
                animation.style.width = '100px';
                animation.style.height = '100px';
                animation.style.backgroundColor = '#0284c7';
                instructionText.innerText = 'Inhale gently through your nose for 4 counts, expanding your belly...';

                setTimeout(() => {
                    if (isAnimating) {
                        animateCircle('contract');
                    }
                }, 6000);
            } else if (action === 'contract') {
                animation.style.width = '50px';
                animation.style.height = '50px';
                animation.style.backgroundColor = '#10b981';
                instructionText.innerText = 'Exhale smoothly through your mouth for 4 counts, releasing bodily tension...';

                setTimeout(() => {
                    if (isAnimating) {
                        animateCircle('expand');
                    }
                }, 6000);
            }
        }
    }

    function reset() {
        isDone = true;
        controlButton.innerText = 'Start';
        instructionText.innerText = 'Tap Start to begin your calming belly breathing session.';
        doneButton.disabled = true;
    }
});
