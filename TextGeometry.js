import {
	ExtrudeGeometry
} from './three.module.js';

class TextGeometry extends ExtrudeGeometry {

	constructor( text, parameters = {} ) {

		const font = parameters.font;

		if ( font === undefined ) {
			throw new Error( 'THREE.TextGeometry: font parameter is required.' );
		}

		const shapes = font.generateShapes( text, parameters.size );

		// translate parameters into extrude params
		const options = Object.assign( {
			depth: parameters.height !== undefined ? parameters.height : 50,
			bevelThickness: parameters.bevelThickness !== undefined ? parameters.bevelThickness : 10,
			bevelSize: parameters.bevelSize !== undefined ? parameters.bevelSize : 8,
			bevelEnabled: parameters.bevelEnabled !== undefined ? parameters.bevelEnabled : false
		}, parameters );

		super( shapes, options );

		this.type = 'TextGeometry';

	}

}

export { TextGeometry };
