var Bundler = require('../lib/Bundler/Bundler');

describe('Bundler', function() {
	var bundler = new Bundler();
	it('Must have properties and methods', function() {
		bundler.should.have.property('loadConfig').which.is.Function();
		bundler.should.have.property('scanNext').which.is.Function();
		bundler.should.have.property('config').which.is.Object();
		bundler.should.have.property('CONFIG_PATH_DEFAULT').which.is.String();
		
	});

});