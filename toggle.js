document.addEventListener('DOMContentLoaded', function () {
    const button = document.getElementById('toggleButton');
    let isActive = false;
  
    button.addEventListener('click', function () {
      isActive = !isActive;
      if (isActive) {
        button.textContent = 'Deactivate';
        button.classList.remove('inactive');
        button.classList.add('active');
        activateScript();
      } else {
        button.textContent = 'Activate';
        button.classList.remove('active');
        button.classList.add('inactive');
        // Call your deactivation function here
        deactivateScript();
      }
    });
  
    function activateScript() {
      console.log('Script activated');
    }
  
    function deactivateScript() {
      console.log('Script deactivated');
    }
  });
  