let dragged;
let id;
let index;
let indexDrop;
let list;

  document.addEventListener("dragstart", (event) => {
      dragged = event.target;
      id = event.target.id;
      list = event.target.parentNode.children;
      Event.dataTransfer.setData('text/plain', 'hello');
      for(let i = 0; i < list.length; i += 1) {
      	if(list[i] === dragged){
          index = i;
        }
      }
  });

  document.addEventListener("dragover", (event) => {
      event.preventDefault();
  });

  document.addEventListener("drop", ({target}) => {
   if(target.className == "dropzone" && target.id !== id) {
       dragged.remove( dragged );
      for(let i = 0; i < list.length; i += 1) {
      	if(list[i] === target){
          indexDrop = i;
        }
      }
      console.log(index, indexDrop);
      if(index > indexDrop) {
      	target.before( dragged );
      } else {
       target.after( dragged );
      }
    }
  });