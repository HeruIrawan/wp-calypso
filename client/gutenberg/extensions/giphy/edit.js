/**
 * External dependencies
 */
import { __ } from 'gutenberg/extensions/presets/jetpack/utils/i18n';
import classNames from 'classnames';
import { Component, createRef } from '@wordpress/element';
import { TextControl } from '@wordpress/components';
import { RichText } from '@wordpress/editor';
import { debounce } from 'lodash';

const GIPHY_API_KEY = 't1PkR1Vq0mzHueIFBvZSZErgFs9NBmYW';

class GiphyEdit extends Component {
	timer = null;
	textControlRef = createRef();

	state = {
		focus: false,
	};

	componentWillUnmount() {
		this.parseSearch.cancel();
	}

	onSearchTextChange = searchText => {
		const { setAttributes } = this.props;
		setAttributes( { searchText } );
		this.parseSearch( searchText );
		this.maintainFocus();
	};

	parseSearch = debounce( searchText => {
		let giphyID = null;
		// If search is hardcoded Giphy URL following this pattern: https://giphy.com/embed/4ZFekt94LMhNK
		if ( searchText.indexOf( '//giphy.com/gifs' ) !== -1 ) {
			giphyID = this.splitAndLast( this.splitAndLast( searchText, '/' ), '-' );
		}
		// If search is hardcoded Giphy URL following this patterh: http://i.giphy.com/4ZFekt94LMhNK.gif
		if ( searchText.indexOf( '//i.giphy.com' ) !== -1 ) {
			giphyID = this.splitAndLast( searchText, '/' ).replace( '.gif', '' );
		}
		// https://media.giphy.com/media/gt0hYzKlMpfOg/giphy.gif
		const match = searchText.match(
			/http[s]?:\/\/media.giphy.com\/media\/([A-Za-z0-9\-\.]+)\/giphy.gif/
		);
		if ( match ) {
			giphyID = match[ 1 ];
		}
		if ( giphyID ) {
			return this.fetch( this.urlForId( giphyID ) );
		}

		return this.fetch( this.urlForSearch( searchText ) );
	}, 250 );

	urlForSearch = searchText => {
		return `https://api.giphy.com/v1/gifs/search?q=${ encodeURIComponent(
			searchText
		) }&api_key=${ encodeURIComponent( GIPHY_API_KEY ) }&limit=1`;
	};

	urlForId = giphyId => {
		return `https://api.giphy.com/v1/gifs/${ encodeURIComponent(
			giphyId
		) }?api_key=${ encodeURIComponent( GIPHY_API_KEY ) }`;
	};

	splitAndLast = ( array, delimiter ) => {
		const split = array.split( delimiter );
		return split[ split.length - 1 ];
	};

	fetch = url => {
		const { setAttributes } = this.props;
		const xhr = new XMLHttpRequest();
		xhr.open( 'GET', url );
		xhr.onload = () => {
			if ( xhr.status === 200 ) {
				const res = JSON.parse( xhr.responseText );
				const giphyData = res.data.length > 0 ? res.data[ 0 ] : res.data;
				// No results
				if ( ! giphyData.images ) {
					return;
				}
				const calculatedPaddingTop = Math.floor(
					( giphyData.images.original.height / giphyData.images.original.width ) * 100
				);
				const paddingTop = `${ calculatedPaddingTop }%`;
				const giphyUrl = giphyData.embed_url;
				setAttributes( { giphyUrl, paddingTop } );
				this.maintainFocus( 500 );
			} else {
				// Error handling TK
			}
		};
		xhr.send();
	};

	setFocus = () => {
		this.maintainFocus();
		this.textControlRef.current.querySelector( 'input' ).focus();
	};

	maintainFocus = ( timeoutDuration = 3500 ) => {
		this.setState( { focus: true }, () => {
			if ( this.timer ) {
				clearTimeout( this.timer );
			}
			if ( this.hasSearchText() ) {
				this.timer = setTimeout( () => {
					this.setState( { focus: false } );
				}, timeoutDuration );
			}
		} );
	};

	clearFocus = () => {
		this.setState( { focus: false }, () => {
			if ( this.timer ) {
				clearTimeout( this.timer );
			}
		} );
	};

	hasSearchText = () => {
		const { attributes } = this.props;
		const { searchText } = attributes;
		return searchText && searchText.length > 0;
	};

	render() {
		const { attributes, className, isSelected, setAttributes } = this.props;
		const { align, caption, giphyUrl, searchText, paddingTop } = attributes;
		const { focus } = this.state;
		const style = { paddingTop };
		const classes = classNames( className, `align${ align }` );
		const textControlClasses = classNames(
			'wp-block-jetpack-giphy_text-input-field',
			focus || ! this.hasSearchText() ? 'has-focus' : 'no-focus'
		);
		return (
			<div className={ classes }>
				<figure style={ style }>
					<div
						className="wp-block-jetpack-giphy_cover"
						onClick={ this.setFocus }
						onKeyDown={ this.setFocus }
						ref={ this.textControlRef }
						role="button"
						tabIndex="0"
					>
						{ ( ! searchText || isSelected ) && (
							<TextControl
								className={ textControlClasses }
								label={ __( 'Search or paste a Giphy URL' ) }
								placeholder={ __( 'Search or paste a Giphy URL' ) }
								onChange={ this.onSearchTextChange }
								onClick={ this.maintainFocus }
								value={ searchText }
							/>
						) }
					</div>
					<iframe src={ giphyUrl } title={ searchText } />
				</figure>
				{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
					<RichText
						className="caption"
						inlineToolbar
						onChange={ value => setAttributes( { caption: value } ) }
						placeholder={ __( 'Write caption…' ) }
						tagName="figcaption"
						value={ caption }
					/>
				) }
			</div>
		);
	}
}
export default GiphyEdit;
