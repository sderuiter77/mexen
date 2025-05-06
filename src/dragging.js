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

  document.addEventListener("drop", (event) => {
    event.preventDefault();
   if(event.target.className == "dropzone" && event.target.id !== id) {
       dragged.remove( dragged );
      for(let i = 0; i < list.length; i += 1) {
      	if(list[i] === event.target){
          indexDrop = i;
        }
      }
      console.log(index, indexDrop);
      if(index > indexDrop) {
      	event.target.before( dragged );
      } else {
       event.target.after( dragged );
      }
    }
  });