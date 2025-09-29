import {
	Loader
} from './three.module.js';

class FontLoader extends Loader {

	load( url, onLoad, onProgress, onError ) {

		const loader = new this.manager.getHandler( url ) || new Loader( this.manager );
		loader.setPath( this.path );
		loader.load( url, ( text ) => {
			const json = ( typeof text === 'string' ) ? JSON.parse( text ) : text;
			const font = this.parse( json );
			if ( onLoad ) onLoad( font );
		}, onProgress, onError );

	}

	parse( json ) {
		return new THREE.Font( json );
	}

}

export { FontLoader };
