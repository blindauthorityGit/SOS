<?php
vc_map(
	array(
		'name' => __( 'Event Countdown', 'jupiter-donut' ),
		'base' => 'mk_countdown',
		'html_template' => dirname( __FILE__ ) . '/mk_countdown.php',
		'icon' => 'icon-mk-event-countdown vc_mk_element-icon',
		'description' => __( 'Countdown module for your events.', 'jupiter-donut' ),
		'category' => __( 'General', 'jupiter-donut' ),
		'params' => array(
			array(
				'type' => 'textfield',
				'heading' => __( 'Title', 'jupiter-donut' ),
				'param_name' => 'title',
				'value' => '',
				'description' => __( '', 'jupiter-donut' ),
			),
			array(
				'type' => 'textfield',
				'heading' => __( 'Upcoming Event Date', 'jupiter-donut' ),
				'param_name' => 'date',
				'value' => '12/24/2019 12:00:00',
				'description' => __( 'Enter the due date for Event. eg : 12/24/2019 12:00:00 => month/day/year hour:minute:second', 'jupiter-donut' ),
			),
			array(
				'heading' => __( 'UTC Timezone', 'jupiter-donut' ),
				'param_name' => 'offset',
				'value' => array(
					'-12' => '-12',
					'-11' => '-11',
					'-10' => '-10',
					'-9' => '-9',
					'-8' => '-8',
					'-7' => '-7',
					'-6' => '-6',
					'-5' => '-5',
					'-4' => '-4',
					'-3' => '-3',
					'-2' => '-2',
					'-1' => '-1',
					'0' => '0',
					'+1' => '+1',
					'+2' => '+2',
					'+3' => '+3',
					'+4' => '+4',
					'+5' => '+5',
					'+6' => '+6',
					'+7' => '+7',
					'+8' => '+8',
					'+9' => '+9',
					'+10' => '+10',
					'+12' => '+12',
				),
				'type' => 'dropdown',
			),
			$add_device_visibility,
			array(
				'type' => 'textfield',
				'heading' => __( 'Extra class name', 'jupiter-donut' ),
				'param_name' => 'el_class',
				'value' => '',
				'description' => __( 'If you wish to style particular content element differently, then use this field to add a class name and then refer to it in your CSS file.', 'jupiter-donut' ),
			),
		),
	)
);
