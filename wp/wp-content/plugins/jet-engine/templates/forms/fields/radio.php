<?php
/**
 * input[type="hidden"] template
 */

$required = $this->get_required_val( $args );
$name     = $args['name'];
$default  = ! empty( $args['default'] ) ? $args['default'] : false;

if ( ! empty( $args['field_options'] ) ) {

	echo '<div class="jet-form__fields-group">';

	foreach ( $args['field_options'] as $value => $option ) {

		$checked = '';
		$calc    = '';

		if ( is_array( $option ) ) {
			$val   = isset( $option['value'] ) ? $option['value'] : $value;
			$label = isset( $option['label'] ) ? $option['label'] : $val;
		} else {
			$val   = $value;
			$label = $option;
		}

		if ( $default ) {
			$checked = checked( $default, $val, false );
		}

		if ( is_array( $option ) && isset( $option['calculate'] ) ) {
			$calc = ' data-calculate="' . $option['calculate'] . '"';
		}

		?>
		<div class="jet-form__field-wrap radio-wrap checkradio-wrap">
			<label class="jet-form__field-label">
				<input
					type="radio"
					name="<?php echo $name; ?>"
					class="jet-form__field radio-field checkradio-field"
					value="<?php echo $val; ?>"
					<?php echo $checked; ?>
					<?php echo $required; ?>
					<?php echo $calc; ?>
				>
				<?php echo $label; ?>
			</label>
		</div>
		<?php

	}

	echo '</div>';

}