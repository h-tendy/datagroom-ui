# What is different in this fork? 

1. Fix for an infinite loop that occurs. This is documented in this bug (https://github.com/olifolkerd/tabulator/issues/2974 - It is not fully fixed yet, although it is closed there because we can't get a reproducible example yet). Further, I found another case where the pixel was off by 2. So, I have now made this as 5 piclient/common/routes/home/MyCodeMirror.jsxels as the error tolerance for potentially calling the `redraw` routine within the `adjustTableSize` function. 

1. Also, added an option to prevent any `redraw` calls. This option is used when I edit a cell and the table size needs to increase just a bit. However, I don't want to lose the scrolling context which happens when `redraw` gets called. The net effect is that the `tabulator` scroll-bar should only appear during edit and disappears as soon as the editing is done. We have to test it further.


1. Unnecessary scroll bar appears. This is documented in this bug (https://github.com/olifolkerd/tabulator/issues/2975) - For this, I did a +1 for the pixel in the same routine as documented above. 

1. When I add an empty row, sometimes, the height of the row contents turns out to be very low (like 8px). I couldn't figure out the root-cause of this one yet. So, for now, an ugly workaround in `cell.js`:

``` js
Cell.prototype.getHeight = function(){
	// J:-> Ugly hack. Couldn't figure out why offsetHeight is so low (8px)
	// sometimes. 
	if (this.height) 
		return this.height;
	let h = Math.max(this.element.offsetHeight, 25);
	return h;
	//return this.height || this.element.offsetHeight;
};
```
1. [10/2/2020] Continuing on the previous modification to `getHeight`, we need one more change in this routine to support `code-mirror` as an editor. The way you initialize `code-mirror` is that it ends up replacing a `textarea` element. In `tabulator`, however, we still need to return an html element. Since the editor element we return gets replaced, adjusting the height of the editor is a challenge. Setting height on the (effectively) hidden element doesn't get reflected in the UI. 
	* The strategy is to provide a hook to explicitly set the Cell's height from the editor logic. Using this, we can adjust the height of the element explicitly to suit the needs of `code-mirror`. See the `MyCodeMirror` class on how it is used. 

	* The required change is as so: 

	``` javascript 
	Cell.prototype.setHeightSpecial = function(h) {
		this.heightSpecial = h;
	}
	Cell.prototype.getHeight = function(){

		if (this.height) 
			return this.height;
		// J:-> Ugly but effective hack. While editing, this will ensure 
		// at least 150px size for code-mirror. 
		let h = this.element.offsetHeight;
		if(this.table.modExists("edit", true)){
			var editing = this.table.modules.edit.getCurrentCell();
			if(editing && editing._getSelf() === this){
				//console.log("style height inside: ", this.element);
				//h = 150;
				if (this.heightSpecial)
					h = Math.max(h, this.heightSpecial);
			}
		}
		// J:-> Ugly hack. Couldn't figure out why offsetHeight is so low (8px)
		// sometimes. 
		h = Math.max(h, 25);
		return h;
		//return this.height || this.element.offsetHeight;
	};

	```
1. Made changes to have some space at the bottom of the table. 
1. Now, editing is always done by 'force' from the application. This is to ensure we don't lose clipboard functionality when editors are enabled. 
