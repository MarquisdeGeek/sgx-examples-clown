// This is all standard boilerplate code for SGX.HTML5

function SGXPrepare_OS() {
	sgxskeleton.PrepareLoadingPage("loadclown");

	new sgx.main.System();

	sgx.graphics.Engine.create(640,400);	// the size of the draw area we (as programmers) will use

	sgx.main.System.writePage();
	sgx.main.System.initialize();	// optionally pass the 'loading_screen' ID here, to hide the contents once loaded
}

function SGXinit() {

	clown = new CETCGame_Clown();
	clown.initialize();
}

function SGXstart() {
}


function SGXupdate(telaps) {
	clown.update(telaps);
}


function SGXdraw() {
	clown.draw();

	sgx.graphics.Engine.get().draw();
}

