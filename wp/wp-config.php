<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'sos' );

/** MySQL database username */
define( 'DB_USER', 'root' );

/** MySQL database password */
define( 'DB_PASSWORD', '' );

/** MySQL hostname */
define( 'DB_HOST', 'localhost' );

/** Database Charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The Database Collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'SHK}c^E{X.$D&EX6]8g#Rt&m@QsC,I2<XC(y* Yrg L@yW9UmB3,83Py<d0>2GNU' );
define( 'SECURE_AUTH_KEY',  'Tm.{$uH/ZrltJ;g2F$)DSPDX=rYw[Fddt*WJ&Ln)*JzlH>L-J0TR@O/E|{+u2JG[' );
define( 'LOGGED_IN_KEY',    'DuvMf%=_%kZ{>45T,AN@0).4;IpeH^%q.U?E+HObtJSK{_6ryBHCOhu0d_3qTxXG' );
define( 'NONCE_KEY',        'Q(tc2k JQ#D+vQ(l5&qaNFoAW;hNyIXeuo]x:c~+?6 V Ic30CaOYl!};*K@VLR9' );
define( 'AUTH_SALT',        '_e8`g,FIC>sq7@MAL8Iu}[H j1W!t1aXN9+b;|-f^pTutJ>*:cY: ^Am964OiM#r' );
define( 'SECURE_AUTH_SALT', ';.##CNU?HpQ#wY0;QW9|Q|xLly|toJ(B.?_=bcyt]wKdTCbZB.NGdt.lDmd_;^^@' );
define( 'LOGGED_IN_SALT',   'XH@{8a268I(@-+X-f2&;7`k(NMaqqKX$hivHpO QFH4 >Qkm={VotB=?zq3.+D<+' );
define( 'NONCE_SALT',       '^}c=d{&30j@wt~N1tp_fXE.ZFJ7DrC1jNa;$t3bmjeGe1$t&eWYfB&?ZD(}/$_pw' );

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define( 'WP_DEBUG', false );
define('WP_MEMORY_LIMIT', '256M');



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', dirname( __FILE__ ) . '/' );
}

/** Sets up WordPress vars and included files. */
require_once( ABSPATH . 'wp-settings.php' );
