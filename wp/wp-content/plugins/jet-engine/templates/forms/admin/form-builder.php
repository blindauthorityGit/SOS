<div id="form_builder">
	<grid-layout class="jet-form-canvas" v-if="!showEditor"
		:layout="layout"
		:col-num="12"
		:row-height="48"
		:margin="[5, 5]"
		:is-draggable="true"
		:is-resizable="true"
		:vertical-compact="true"
		:use-css-transforms="true"
		:style="{ margin: '0 -5px' }"
		@layout-updated="updateLayout"
	>
		<grid-item class="jet-form-canvas__field"
			v-for="( item, index ) in layout"
			:key="item.i"
			:x="item.x"
			:y="item.y"
			:w="item.w"
			:h="item.h"
			:i="item.i"
			:max-h="1"
		>
			<div class="jet-form-canvas__field-content">
				<div class="jet-form-canvas__field-start">
					<div class="jet-form-canvas__field-remove" @click="removeField( item, index )"></div>
					<div class="jet-form-canvas__field-label">
						<span class="jet-form-canvas__field-name">
							<span v-html="itemInstance( item )"></span>:&nbsp;
							<span v-if="'submit' === item.settings.type">{{ item.settings.label }}</span>
							<span v-else>{{ item.settings.name }}</span>
						</span>
						<span class="jet-form-canvas__field-type">Type: {{ item.settings.type }}</span>
					</div>
				</div>
				<div class="jet-form-canvas__field-end">
					<span>{{ currentWidth( item.w ) }}</span>
					<div class="jet-form-canvas__field-edit" @click="editField( item, index )">
						<span class="dashicons dashicons-edit"></span>
					</div>
				</div>
			</div>
		</grid-item>
	</grid-layout>
	<div class="jet-form-canvas__actions" v-if="!showEditor">
		<div class="jet-form-canvas__captcha">
			<label>
				<input type="checkbox" name="_captcha[enabled]" v-model="captcha.enabled">
				<?php _e( 'Enable reCAPTCHA v3 form verification', 'jet-enegine' ); ?>
			</label>
		</div>
		<div class="jet-form-canvas__buttons">
			<button type="button" class="jet-form-canvas__add" @click="addField( false, false )"><?php
				_e( 'Add Field', 'jet-engine' );
			?></button>
			<button type="button" class="jet-form-canvas__add add-default" @click="addField( true, false )"><?php
				_e( 'Add Submit Button', 'jet-engine' );
			?></button>
			<button type="button" class="jet-form-canvas__add add-default" @click="addField( false, false, true )"><?php
				_e( 'Add Page Break', 'jet-engine' );
			?></button>
		</div>
		<div class="jet-form-canvas__captcha-fields" v-if="captcha.enabled">
			<label>
				<?php _e( 'Site Key:', 'jet-engine' ); ?><br>
				<input type="text" name="_captcha[key]" v-model="captcha.key">
			</label>
			<label>
				<?php _e( 'Secret Key:', 'jet-engine' ); ?><br>
				<input type="text" name="_captcha[secret]" v-model="captcha.secret">
			</label>
			<div class="jet-form-canvas__captcha-info">
				<i><?php
				printf(
					__( 'Register reCAPTCHA v3 keys %s.', 'jet-engine' ),
					'<a href="https://www.google.com/recaptcha/admin/create">' . __( 'here', 'jet-engine' ) . '</a>'
				);
				?></i>
			</div>
		</div>
	</div>
	<div class="jet-form-canvas__result">
		<textarea name="_form_data">{{ resultJSON }}</textarea>
	</div>
	<div class="jet-form-editor" v-if="showEditor">
		<div class="jet-form-editor__header">
			<span v-html="itemInstance( currentItem )"></span>: {{ currentItem.settings.name }}
		</div>
		<div class="jet-form-editor__content"
			v-if="true === currentItem.settings.is_submit || true === currentItem.settings.is_page_break"
		>
			<div class="jet-form-editor__row">
				<div class="jet-form-editor__row-label"><?php _e( 'Label:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.label">
				</div>
			</div>
			<div class="jet-form-editor__row" v-if="true === currentItem.settings.is_page_break">
				<div class="jet-form-editor__row-label"><?php _e( 'Disabled message:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<textarea v-model="currentItem.settings.page_break_disabled" rows="4" style="height: 100px;"></textarea>
				</div>&nbsp;&nbsp;&nbsp;&nbsp;
				<div class="jet-form-editor__row-notice"><?php
					_e( 'Text to show if next page button is disabled. For example - "Fill required fields" etc.', 'jet-engine' );
				?></div>
			</div>
			<div class="jet-form-editor__row">
				<div class="jet-form-editor__row-label"><?php _e( 'Custom CSS Class:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.class_name">
				</div>
			</div>
			<div class="jet-form-editor__row">
				<div class="jet-form-editor__row-label"><?php _e( 'Add Prev Page Button:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="checkbox" value="required" v-model="currentItem.settings.add_prev">
				</div>&nbsp;&nbsp;&nbsp;&nbsp;
				<div class="jet-form-editor__row-notice"><?php
					_e( 'Check this to add prev page button before this button. Will work only if previous page exists', 'jet-engine' );
				?></div>
			</div>
			<div class="jet-form-editor__row" v-if="currentItem.settings.add_prev">
				<div class="jet-form-editor__row-label"><?php _e( 'Prev Page Button Label:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.prev_label">
				</div>
			</div>
		</div>
		<div class="jet-form-editor__content"
			v-if="false === currentItem.settings.is_message && false === currentItem.settings.is_submit && ! currentItem.settings.is_page_break"
		>
			<div class="jet-form-editor__row">
				<div class="jet-form-editor__row-label"><?php _e( 'Type:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<select type="text" v-model="currentItem.settings.type" @change="setHeadingName()">
						<option v-for="( typeLabel, typeVal ) in fieldTypes" :value="typeVal">{{ typeLabel }}</option>
					</select>
				</div>
			</div>
			<?php
				/**
				 * Add custom fields on this hook
				 */
				do_action( 'jet-engine/forms/edit-field/before' );
			?>
			<div class="jet-form-editor__row" v-if="'text' === currentItem.settings.type">
				<div class="jet-form-editor__row-label"><?php _e( 'Field Type:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<select type="text" v-model="currentItem.settings.field_type">
						<option v-for="( typeLabel, typeName ) in inputTypes" :value="typeName">{{ typeLabel }}</option>
					</select>
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="'media' === currentItem.settings.type"
			>
				<div class="jet-form-editor__row-label fullwidth-label"><?php _e( 'Note: for security reasons this field will work only for logged-in users!', 'jet-engine' ); ?></div>
			</div>
			<div class="jet-form-editor__row" v-if="'heading' !== currentItem.settings.type && 'group_break' !== currentItem.settings.type">
				<div class="jet-form-editor__row-label"><?php _e( 'Name:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.name">
				</div>
			</div>
			<div class="jet-form-editor__row" v-if="'group_break' !== currentItem.settings.type">
				<div class="jet-form-editor__row-label"><?php _e( 'Label:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.label">
				</div>
			</div>
			<div class="jet-form-editor__row" v-if="'group_break' !== currentItem.settings.type">
				<div class="jet-form-editor__row-label"><?php _e( 'Description:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.desc">
				</div>
			</div>
			<div class="jet-form-editor__row"
				 v-if="!inArray( currentItem.settings.type, [ 'calculated', 'wysiwyg', 'range', 'heading', 'group_break' ] )"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Required:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="checkbox" value="required" v-model="currentItem.settings.required">
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="'hidden' === currentItem.settings.type"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Field Value:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<select type="text" v-model="currentItem.settings.hidden_value">
						<option value="post_id"><?php _e( 'Current Post ID', 'jet-engine' ); ?></option>
						<option value="post_title"><?php _e( 'Current Post Title', 'jet-engine' ); ?></option>
						<option value="post_url"><?php _e( 'Current Post/Page URL', 'jet-engine' ); ?></option>
						<option value="post_meta"><?php _e( 'Current Post Meta', 'jet-engine' ); ?></option>
						<option value="user_id"><?php _e( 'Current User ID', 'jet-engine' ); ?></option>
						<option value="user_email"><?php _e( 'Current User Email', 'jet-engine' ); ?></option>
						<option value="author_id"><?php _e( 'Current Post Author ID', 'jet-engine' ); ?></option>
						<option value="author_email"><?php _e( 'Current Post Author Email', 'jet-engine' ); ?></option>
						<option value="query_var"><?php _e( 'URL Query Variable', 'jet-engine' ); ?></option>
					</select>
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="'hidden' === currentItem.settings.type && 'post_meta' === currentItem.settings.hidden_value"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Meta field to get value from:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.hidden_value_field">
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="'hidden' === currentItem.settings.type && 'query_var' === currentItem.settings.hidden_value"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Query variable key:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.query_var_key">
				</div>&nbsp;&nbsp;&nbsp;&nbsp;
				<div class="jet-form-editor__row-notice"><?php
					_e( 'Query parameter name', 'jet-engine' );
				?></div>
			</div>
			<div class="jet-form-editor__row"
				v-if="inArray( currentItem.settings.type, [ 'select', 'checkboxes', 'radio' ] )"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Fill Options From:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<select type="text" v-model="currentItem.settings.field_options_from">
						<option value="manual_input"><?php _e( 'Manual Input', 'jet-engine' ); ?></option>
						<option value="posts"><?php _e( 'Posts', 'jet-engine' ); ?></option>
						<option value="terms"><?php _e( 'Terms', 'jet-engine' ); ?></option>
						<option value="meta_field"><?php _e( 'Meta Field', 'jet-engine' ); ?></option>
					</select>
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="inArray( currentItem.settings.type, [ 'select', 'checkboxes', 'radio' ] ) && 'posts' === currentItem.settings.field_options_from"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Post type:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<select type="text" v-model="currentItem.settings.field_options_post_type">
						<option v-for="( typeLabel, typeValue ) in postTypes" :value="typeValue" >
							{{ typeLabel }}
						</option>
					</select>
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="inArray( currentItem.settings.type, [ 'select', 'checkboxes', 'radio' ] ) && 'terms' === currentItem.settings.field_options_from"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Taxonomy:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<select type="text" v-model="currentItem.settings.field_options_tax">
						<option v-for="( taxLabel, taxValue ) in taxonomies" :value="taxValue" >
							{{ taxLabel }}
						</option>
					</select>
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="inArray( currentItem.settings.type, [ 'select', 'checkboxes', 'radio' ] ) && 'meta_field' === currentItem.settings.field_options_from"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Meta field to get value from:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.field_options_key">
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="inArray( currentItem.settings.type, [ 'select', 'checkboxes', 'radio' ] ) && 'manual_input' === currentItem.settings.field_options_from"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Options List:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<div class="jet-form-repeater">
						<div class="jet-form-repeater__items">
							<div class="jet-form-repeater__item"
								v-for="( option, index ) in currentItem.settings.field_options"
							>
								<div class="jet-form-repeater__item-input">
									<div class="jet-form-repeater__item-input-label"><?php
										_e( 'Value:', 'jet-engine' );
									?></div>
									<input type="text" v-model="currentItem.settings.field_options[ index ].value">
								</div>
								<div class="jet-form-repeater__item-input">
									<div class="jet-form-repeater__item-input-label"><?php
										_e( 'Label:', 'jet-engine' );
									?></div>
									<div class="jet-form-repeater__item-input-control">
										<input type="text" v-model="currentItem.settings.field_options[ index ].label">
									</div>
								</div>
								<div class="jet-form-repeater__item-input">
									<div class="jet-form-repeater__item-input-label"><?php
										_e( 'Calculate:', 'jet-engine' );
									?></div>
									<div class="jet-form-repeater__item-input-control">
										<input type="text" v-model="currentItem.settings.field_options[ index ].calculate">
									</div>
								</div>
								<div class="jet-form-repeater__item-delete">
									<span class="dashicons dashicons-dismiss"
										@click="deleteRepeterItem( index, currentItem.settings.field_options )"
									></span>
								</div>
							</div>
						</div>
						<button type="button" class="button"
							@click="addRepeaterItem( currentItem.settings.field_options, { value: '', label: '' } )"
						><?php
							_e( 'Add Option', 'jet-engine' );
						?></button>
					</div>
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="'calculated' === currentItem.settings.type"
			>
				<div class="jet-form-editor__row-label">
					<?php _e( 'Calculation Formula:', 'jet-engine' ); ?>
					<div class="jet-form-editor__row-notice">
						<?php _e( 'Set math formula to calculate field value.', 'jet-engine' ); ?><br>
						<?php _e( 'For example:', 'jet-engine' ); ?><br><br>
						%FIELD::quantity%*%META::price%<br><br>
						<?php _e( 'Where:', 'jet-engine' ); ?><br>
						- <?php _e( '%FIELD::quantity% - macros for form field value. "quantity" - is a field name to get value from', 'jet-engine' ); ?><br>
						- <?php _e( '%META::price% - macros for current post meta value. "quantity" - is a meta key to get value from', 'jet-engine' ); ?>
					</div>
				</div>
				<div class="jet-form-editor__row-control">
					<textarea v-model="currentItem.settings.calc_formula"></textarea>
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="'calculated' === currentItem.settings.type"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Decimal Places Number:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="number" min="0" max="20" v-model="currentItem.settings.precision">
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="'calculated' === currentItem.settings.type"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Calculated Value Prefix:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.calc_prefix">
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="'calculated' === currentItem.settings.type"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Calculated Value Suffix:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.calc_suffix">
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="'text' === currentItem.settings.type || 'select' === currentItem.settings.type || 'textarea' === currentItem.settings.type || 'number' === currentItem.settings.type"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Placeholder:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.placeholder">
				</div>
			</div>
			<div class="jet-form-editor__row"
				v-if="'hidden' !== currentItem.settings.type && 'media' !== currentItem.settings.type && 'heading' !== currentItem.settings.type && 'group_break' !== currentItem.settings.type"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Default:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.default">
				</div>
			</div>
			<div class="jet-form-editor__row"
				 v-if="inArray( currentItem.settings.type, [ 'number', 'range' ] )"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Min Value:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="number" v-model="currentItem.settings.min">
				</div>
			</div>
			<div class="jet-form-editor__row"
				 v-if="inArray( currentItem.settings.type, [ 'number', 'range' ] )"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Max Value:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="number" v-model="currentItem.settings.max">
				</div>
			</div>
			<div class="jet-form-editor__row"
				 v-if="inArray( currentItem.settings.type, [ 'number', 'range' ] )"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Step:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="number" v-model="currentItem.settings.step">
				</div>
			</div>
			<div class="jet-form-editor__row"
				 v-if="'range' === currentItem.settings.type"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Value prefix:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.prefix">
				</div>
			</div>
			<div class="jet-form-editor__row"
				 v-if="'range' === currentItem.settings.type"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Value suffix:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.suffix">
				</div>
			</div>
			<div class="jet-form-editor__row" v-if="'media' === currentItem.settings.type">
				<div class="jet-form-editor__row-label"><?php _e( 'User access:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<select type="text" v-model="currentItem.settings.allowed_user_cap">
						<option value="all"><?php _e( 'Any registered user', 'jet-engine' ); ?></option>
						<option value="upload_files"><?php _e( 'Any user, who allowed to upload files', 'jet-engine' ); ?></option>
						<option value="edit_posts"><?php _e( 'Any user, who allowed to edit posts', 'jet-engine' ); ?></option>
					</select>
				</div>
			</div>
			<div class="jet-form-editor__row" v-if="'media' === currentItem.settings.type">
				<div class="jet-form-editor__row-label"><?php _e( 'Insert attachment:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="checkbox" value="1" v-model="currentItem.settings.insert_attachment">
				</div>&nbsp;&nbsp;&nbsp;&nbsp;
				<div class="jet-form-editor__row-notice"><?php
					_e( 'If checked new attachment will be inserted for uploaded file', 'jet-engine' );
				?></div>
			</div>
			<div class="jet-form-editor__row" v-if="'media' === currentItem.settings.type && currentItem.settings.insert_attachment">
				<div class="jet-form-editor__row-label"><?php _e( 'Field value:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<select v-model="currentItem.settings.value_format">
						<option value="id"><?php _e( 'Attachment ID', 'jet-engine' ); ?></option>
						<option value="url"><?php _e( 'Attachment URL', 'jet-engine' ); ?></option>
						<option value="both"><?php _e( 'Array with attachment ID and URL', 'jet-engine' ); ?></option>
					</select>
				</div>
			</div>
			<div class="jet-form-editor__row" v-if="'media' === currentItem.settings.type">
				<div class="jet-form-editor__row-label"><?php _e( 'Maximum allowed files to upload:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="number" v-model="currentItem.settings.max_files" min="1">
				</div>&nbsp;&nbsp;&nbsp;&nbsp;
				<div class="jet-form-editor__row-notice"><?php
					_e( 'If not set allow to upload 1 file', 'jet-engine' );
				?></div>
			</div>
			<div class="jet-form-editor__row" v-if="'media' === currentItem.settings.type">
				<div class="jet-form-editor__row-label"><?php _e( 'Maximum size in Mb:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="number" v-model="currentItem.settings.max_size" step="0.1" min="0.1">
				</div>&nbsp;&nbsp;&nbsp;&nbsp;
				<div class="jet-form-editor__row-notice">Mb</div>
			</div>
			<div class="jet-form-editor__row" v-if="'media' === currentItem.settings.type">
				<div class="jet-form-editor__row-label"><?php _e( 'Allow MIME types:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<select v-model="currentItem.settings.allowed_mimes" multiple size="10">
						<option v-for="mime in mimes" :value="mime">{{ mime }}</option>
					</select>
				</div>&nbsp;&nbsp;&nbsp;&nbsp;
				<div class="jet-form-editor__row-notice"><?php
					_e( 'If no MIME type selected will allow all types.', 'jet-engine' );
				?><br><?php
					_e( 'Hold down the Ctrl (windows) / Command (Mac) button to select multiple options.', 'jet-engine' );
				?></div>
			</div>
			<div class="jet-form-editor__row"
				v-if="'hidden' !== currentItem.settings.type"
			>
				<div class="jet-form-editor__row-label"><?php _e( 'Field Visibility:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<select type="text" v-model="currentItem.settings.visibility">
						<option value="all"><?php _e( 'For all', 'jet-engine' ); ?></option>
						<option value="logged_id"><?php _e( 'Only for logged in users', 'jet-engine' ); ?></option>
						<option value="not_logged_in"><?php _e( 'Only for NOT-logged in users', 'jet-engine' ); ?></option>
					</select>
				</div>
			</div>
			<div class="jet-form-editor__row">
				<div class="jet-form-editor__row-label"><?php _e( 'Custom CSS Class:', 'jet-engine' ); ?></div>
				<div class="jet-form-editor__row-control">
					<input type="text" v-model="currentItem.settings.class_name">
				</div>
			</div>
			<?php
				/**
				 * Add custom fields on this hook
				 */
				do_action( 'jet-engine/forms/edit-field/after' );
			?>
		</div>
		<div class="jet-form-editor__actions">
			<div class="jet-form-editor__buttons">
				<button type="button" class="button button-primary button-large" @click="applyFieldChanges"><?php
					_e( 'Apply Changes', 'jet-engine' );
				?></button>
				&nbsp;&nbsp;
				<button type="button" class="button button-default button-large" @click="cancelFieldChanges"><?php
					_e( 'Cancel', 'jet-engine' );
				?></button>
			</div>
		</div>
	</div>
	<div class="jet-form-canvas__preset">
		<div class="jet-form-canvas__preset-enable">
			<label class="jet-form-canvas__preset-heading">
				<input type="checkbox" name="_preset[enabled]" v-model="preset.enabled">
				<?php _e( 'Pre-set form field values', 'jet-enegine' ); ?>
			</label>
			<div class="jet-form-canvas__preset-controls" v-if="preset.enabled">
				<div class="jet-form-canvas__preset-row">
					<span><?php _e( 'Source:', 'jet-engine' ); ?></span>
					<select type="text" name="_preset[from]" v-model="preset.from">
						<option value="post"><?php _e( 'Post', 'jet-engine' ); ?></option>
						<option value="user"><?php _e( 'User', 'jet-engine' ); ?></option>
						<option value="query_vars"><?php _e( 'URL Query Variables', 'jet-engine' ); ?></option>
					</select>
				</div>
				<div class="jet-form-canvas__preset-row" v-if="'post' === preset.from">
					<span><?php _e( 'Get post ID from:', 'jet-engine' ); ?></span>
					<select type="text" name="_preset[post_from]" v-model="preset.post_from">
						<option value="current_post"><?php _e( 'Current post', 'jet-engine' ); ?></option>
						<option value="query_var"><?php _e( 'URL Query Variable', 'jet-engine' ); ?></option>
					</select>
				</div>
				<div class="jet-form-canvas__preset-row" v-if="'user' === preset.from">
					<span><?php _e( 'Get user ID from:', 'jet-engine' ); ?></span>
					<select type="text" name="_preset[user_from]" v-model="preset.user_from">
						<option value="current_user"><?php _e( 'Current user', 'jet-engine' ); ?></option>
						<option value="query_var"><?php _e( 'URL Query Variable', 'jet-engine' ); ?></option>
					</select>
				</div>
				<div class="jet-form-canvas__preset-row" v-if="( 'post' === preset.from && 'query_var' === preset.post_from ) || ( 'user' === preset.from && 'query_var' === preset.user_from )">
					<span><?php _e( 'Query variable name:', 'jet-engine' ); ?></span>
					<input type="text" name="_preset[query_var]" v-model="preset.query_var">
				</div>
				<div class="jet-form-canvas__preset-row">
					<span><?php _e( 'Fields Map:', 'jet-engine' ); ?></span>
					<div class="jet-form-canvas__preset-fields-map">
						<div class="jet-form-editor__row-map" v-for="field in availableFields">
							<span><i>{{ field }}</i></span>
							<div class="jet-post-field-control">
								<input :name="'_preset[fields_map][' + field + '][key]'" placeholder="<?php _e( 'Query variable key' ); ?>" v-model="preset.fields_map[ field ].key" v-if="'query_vars' === preset.from" type="text">
								<div class="jet-post-field-control__inner" v-if="'post' === preset.from">
									<select :name="'_preset[fields_map][' + field + '][prop]'" v-if="'post' === preset.from" v-model="preset.fields_map[ field ].prop">
										<option value=""><?php _e( 'Select post property...', 'jet-engine' ); ?></option>
										<option value="ID"><?php _e( 'Post ID', 'jet-engine' ); ?></option>
										<option value="post_title"><?php _e( 'Post Title', 'jet-engine' ); ?></option>
										<option value="post_content"><?php _e( 'Post Content', 'jet-engine' ); ?></option>
										<option value="post_excerpt"><?php _e( 'Post Excerpt', 'jet-engine' ); ?></option>
										<option value="post_thumb"><?php _e( 'Post Thumbnail', 'jet-engine' ); ?></option>
										<option value="post_meta"><?php _e( 'Post Meta', 'jet-engine' ); ?></option>
										<option value="post_terms"><?php _e( 'Post Terms', 'jet-engine' ); ?></option>
									</select>
									<input :name="'_preset[fields_map][' + field + '][key]'" placeholder="<?php _e( 'Meta field key' ) ?>" v-if="'post_meta' === preset.fields_map[ field ].prop" v-model="preset.fields_map[ field ].key" type="text">
									<select :name="'_preset[fields_map][' + field + '][key]'" v-if="'post_terms' === preset.fields_map[ field ].prop" v-model="preset.fields_map[ field ].key">
										<option v-for="( taxLabel, taxValue ) in taxonomies" :value="taxValue" >
											{{ taxLabel }}
										</option>
									</select>
								</div>
								<div class="jet-post-field-control__inner" v-if="'user' === preset.from">
									<select :name="'_preset[fields_map][' + field + '][prop]'" v-if="'user' === preset.from" v-model="preset.fields_map[ field ].prop">
										<option value=""><?php _e( 'Select user property...', 'jet-engine' ); ?></option>
										<option value="ID"><?php _e( 'User ID', 'jet-engine' ); ?></option>
										<option v-for="( ufLabel, ufKey ) in userFields" :value="ufKey">
											{{ ufLabel }}
										</option>
										<option value="user_meta"><?php _e( 'User Meta', 'jet-engine' ); ?></option>
									</select>
									<input :name="'_preset[fields_map][' + field + '][key]'" placeholder="<?php _e( 'Meta field key' ) ?>" v-if="'user_meta' === preset.fields_map[ field ].prop" v-model="preset.fields_map[ field ].key" type="text">
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
