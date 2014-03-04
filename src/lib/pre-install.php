<?php

include_once 'install-funcs.inc.php';

// set default timezone
date_default_timezone_set('UTC');

$OLD_PWD = $_SERVER['PWD'];

// work from lib directory
chdir(dirname($argv[0]));

if ($argv[0] === './pre-install.php' || $_SERVER['PWD'] !== $OLD_PWD) {
	// pwd doesn't resolve symlinks
	$LIB_DIR = $_SERVER['PWD'];
} else {
	// windows doesn't update $_SERVER['PWD']...
	$LIB_DIR = getcwd();
}

$APP_DIR = dirname($LIB_DIR);
$CONF_DIR = $APP_DIR . DIRECTORY_SEPARATOR . 'conf';
$CONFIG_FILE = $CONF_DIR . DIRECTORY_SEPARATOR . 'config.ini';
$APACHE_CONFIG_FILE = $CONF_DIR . DIRECTORY_SEPARATOR . 'httpd.conf';


// setup configuration defaults and help

$DEFAULTS = array(
	'APP_DIR' => $APP_DIR,
	'DATA_DIR' => str_replace('/apps/', '/data/', $APP_DIR),
	'MOUNT_PATH' => '',
	'DB_DSN' => 'sqlite:testdata.db',
	'DB_USER' => '',
	'DB_PASS' => '',
	'AUTH_FILE' => $CONF_DIR . DIRECTORY_SEPARATOR . 'users.htpasswd'
);

$HELP_TEXT = array(
	'APP_DIR' => 'Absolute path to application root directory',
	'DATA_DIR' => 'Absolute path to application data directory',
	'MOUNT_PATH' => 'Url path to application',
	'DB_DSN' => 'Database connection DSN string',
	'DB_USER' => 'Read/write username for database connections',
	'DB_PASS' => 'Password for database user',
	'AUTH_FILE' => 'Name of htpassword authorization file'
);


include_once 'configure.php';


// output apache configuration
file_put_contents($APACHE_CONFIG_FILE, '
	# auto generated by ' . __FILE__ . ' at ' . date('r') . '
	Alias ' . $CONFIG['MOUNT_PATH'] . ' ' . $CONFIG['APP_DIR'] . '/htdocs
	<Location ' . $CONFIG['MOUNT_PATH'] . '>
		Order Allow,Deny
		Allow from all

		# This authorization file can be created on *nix systems using:
		#   htpasswd -c users.passwd <username>
		# You will be prompted for the password

		AuthType Basic
		AuthName \'Authorization Required\'
		AuthBasicProvider file
		AuthUserFile ' . $CONFIG['AUTH_FILE'] . '
		Require valid-user
	</Location>
	RewriteRule ^${MOUNT_PATH}/observation_data/(.*)\$ /observation_data.php?id=\$1 [L,PT]
	RewriteRule ^${MOUNT_PATH}/observatory_detail_feed/(.*)\$ /observatory_detail_feed.php?id=\$1 [L,PT]
	RewriteRule ^${MOUNT_PATH}/observatory_summary_feed\$ /observatory_summary_feed.php [L,PT]
	RewriteRule ^${MOUNT_PATH}/observation/\$ /observation.php?id=\$1 [L,PT]
	RewriteRule ^${MOUNT_PATH}/observatory/\$ /observatory.php?id=\$1 [L,PT]
');

$answer = configure('DO_DB_SETUP', 'N',
		'Would you like to set up the database at this time');

if (responseIsAffirmative($answer)) {
	include_once 'setup_database.php';
}
