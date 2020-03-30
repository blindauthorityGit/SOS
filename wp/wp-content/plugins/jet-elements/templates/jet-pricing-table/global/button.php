<?php
/**
 * Pricing table action button
 */

$settings = $this->get_settings_for_display();

$button_size = ! empty( $settings['button_size'] ) ? $settings['button_size'] : 'auto';

$this->add_render_attribute( 'button', array(
	'class' => array(
		'elementor-button',
		'elementor-size-md',
		'pricing-table-button',
		'button-' . $button_size . '-size',
	),
	'href' => $settings['button_url'],
) );

if ( isset( $settings['button_is_external'] ) && filter_var( $settings['button_is_external'], FILTER_VALIDATE_BOOLEAN ) ) {
	$this->add_render_attribute( 'button', 'target', '_blank' );
}

if ( isset( $settings['button_nofollow'] ) && filter_var( $settings['button_nofollow'], FILTER_VALIDATE_BOOLEAN ) ) {
	$this->add_render_attribute( 'button', 'rel', 'nofollow' );
}

?>
<a <?php echo $this->get_render_attribute_string( 'button' ); ?>><?php

	$position = $settings['button_icon_position'];
	$icon     = $settings['add_button_icon'];

	if ( $icon && 'left' === $position ) {
		echo $this->__icon( 'button_icon', '<span class="jet-elements-icon button-icon">%s</span>' );
	}

	echo $this->__html( 'button_text' );

	if ( $icon && 'right' === $position ) {
		echo $this->__icon( 'button_icon', '<span class="jet-elements-icon button-icon">%s</span>' );
	}

?></a>
