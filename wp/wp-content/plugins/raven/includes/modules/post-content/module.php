<?php

namespace Raven\Modules\Post_Content;

defined( 'ABSPATH' ) || die();

use Raven\Base\Module_base;

class Module extends Module_Base {

	public function get_widgets() {
		return [ 'post-content' ];
	}

}
