<div id="notifications_builder">
	<div class="jet-form-list">
		<slick-list lock-axis="y" :use-drag-handle="true" v-model="items">
			<slick-item v-for="( item, index ) in items" :index="index" :key="index">
				<div class="notifications-builder jet-form-list__item">
				<div class="jet-form-list__item-handle" v-handle>
					<svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
						<line y1="0.5" x2="12" y2="0.5" stroke="#DDDDDD"/>
						<line y1="6.5" x2="12" y2="6.5" stroke="#DDDDDD"/>
						<line y1="3.5" x2="12" y2="3.5" stroke="#DDDDDD"/>
					</svg>
				</div>
				<div class="jet-form-canvas__field-content">
					<div class="jet-form-canvas__field-start">
						<div class="jet-form-canvas__field-remove" @click="removeItem( item, index )"></div>
						<div class="jet-form-canvas__field-label">
							<span class="jet-form-canvas__field-name">
								<span v-html="availableTypes[ item.type ]"></span>
							</span>
							<span class="jet-form-canvas__field-notice" v-if="showRedirectNotice( item, index )" v-html="redirectNotice"></spam>
						</div>
					</div>
					<div class="jet-form-canvas__field-end">
						<div class="jet-form-canvas__field-edit" @click="editItem( item, index )">
							<span class="dashicons dashicons-edit"></span>
						</div>
					</div>
				</div>
				<div class="jet-form-editor" v-if="showEditor && index === currentIndex">
					<div class="jet-form-editor__content">
						<div class="jet-form-editor__row">
							<div class="jet-form-editor__row-label"><?php _e( 'Type:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<select type="text" v-model="currentItem.type">
									<option v-for="( typeLabel, typeValue ) in availableTypes" :value="typeValue">
										{{ typeLabel }}
									</option>
								</select>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'hook' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Hook Name:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<input type="text" v-model="currentItem.hook_name">
								<div class="jet-form-editor__row-note">
									jet-engine-booking/{{ currentItem.hook_name }}
								</div>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'email' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Mail to:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<select type="text" v-model="currentItem.mail_to">
									<option value="admin"><?php _e( 'Admin email', 'jet-engine' ); ?></option>
									<option value="form"><?php _e( 'Email from submitted form field', 'jet-engine' ); ?></option>
									<option value="custom"><?php _e( 'Custom email', 'jet-engine' ); ?></option>
								</select>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'email' === currentItem.type && 'custom' === currentItem.mail_to">
							<div class="jet-form-editor__row-label"><?php _e( 'Email Address:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<input type="text" v-model="currentItem.custom_email">
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'email' === currentItem.type && 'form' === currentItem.mail_to">
							<div class="jet-form-editor__row-label"><?php _e( 'From Field:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<select type="text" v-model="currentItem.from_field">
									<option v-for="field in availableFields" :value="field" >{{ field }}</option>
								</select>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'email' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Reply to:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<select type="text" v-model="currentItem.reply_to">
									<option value=""><?php _e( 'Not selected', 'jet-engine' ); ?></option>
									<option value="form"><?php _e( 'Email from submitted form field', 'jet-engine' ); ?></option>
									<option value="custom"><?php _e( 'Custom email', 'jet-engine' ); ?></option>
								</select>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'email' === currentItem.type && 'custom' === currentItem.reply_to">
							<div class="jet-form-editor__row-label"><?php _e( 'Reply to Email Address:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<input type="text" v-model="currentItem.reply_to_email">
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'email' === currentItem.type && 'form' === currentItem.reply_to">
							<div class="jet-form-editor__row-label"><?php _e( 'Reply To Email From Field:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<select type="text" v-model="currentItem.reply_from_field">
									<option v-for="field in availableFields" :value="field" >{{ field }}</option>
								</select>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'insert_post' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Post Type:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<select type="text" v-model="currentItem.post_type">
									<option v-for="( typeLabel, typeValue ) in postTypes" :value="typeValue">
										{{ typeLabel }}
									</option>
								</select>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'insert_post' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Post Status:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<select type="text" v-model="currentItem.post_status">
									<option value=""><?php _e( 'Select status...', 'jet-engine' ); ?></option>
									<option v-for="( statusLabel, statusValue ) in postStatuses" :value="statusValue" >
										{{ statusLabel }}
									</option>
									<option value="keep-current"><?php _e( 'Keep current status (when updating post)', 'jet-engine' ); ?></option>
								</select>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'insert_post' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Fields Map:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<div class="jet-form-editor__row-notice"><?php
									_e( 'Set meta fields names or post properties to save apropriate form fields into', 'jet-engine' );
								?></div>
								<div class="jet-form-editor__row-fields">
									<div class="jet-form-editor__row-map" v-for="( field, index ) in availableFields" :key="field + index" v-if="'inserted_post_id' !== field && 'user_id' !== field">
										<span>{{ field }}</span>
										<jet-post-field-control :fields="postProps" meta-prop="post_meta" terms-prop="post_terms" v-model="currentItem.fields_map[ field ]"></jet-post-field-control>
									</div>
								</div>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'insert_post' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Default Fields:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<div class="jet-form-editor__row-notice"><?php
									_e( 'Set default meta values which should be set on post creation', 'jet-engine' );
								?></div>
								<div class="jet-form-editor__row-fields">
									<div class="jet-form-repeater">
										<div class="jet-form-repeater__items">
											<div class="jet-form-repeater__item" v-for="( field, index ) in currentItem.default_meta" :key="'default-meta-' + index">
												<div class="jet-form-repeater__item-input" style="width: 43.5%;">
													<div class="jet-form-repeater__item-input-label"><?php
														_e( 'Meta Key:', 'jet-engine' );
													?></div>
													<input type="text" v-model="currentItem.default_meta[ index ].key">
												</div>
												<div class="jet-form-repeater__item-input" style="width: 43.5%;">
													<div class="jet-form-repeater__item-input-label"><?php
														_e( 'Meta Value:', 'jet-engine' );
													?></div>
													<div class="jet-form-repeater__item-input-control">
														<input type="text" v-model="currentItem.default_meta[ index ].value">
													</div>
												</div>
												<div class="jet-form-repeater__item-delete">
													<span class="dashicons dashicons-dismiss" @click="deleteRepeterItem( index, currentItem.default_meta )"
													></span>
												</div>
											</div>
										</div>
										<button type="button" class="button" @click="addRepeaterItem( currentItem.default_meta, { key: '', value: '' } )"><?php
											_e( 'Add Option', 'jet-engine' );
										?></button>
									</div>
								</div>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'update_user' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Fields Map:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<div class="jet-form-editor__row-notice"><?php
									_e( 'Set user properties or meta fields to save apropriate form fields into', 'jet-engine' );
								?></div>
								<div class="jet-form-editor__row-fields">
									<div class="jet-form-editor__row-map" v-for="field in availableFields" v-if="'inserted_post_id' !== field">
										<span>{{ field }}</span>
										<jet-post-field-control :fields="userProps" meta-prop="user_meta" :terms-prop="false" v-model="currentItem.fields_map[ field ]"></jet-post-field-control>
									</div>
								</div>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'register_user' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Fields Map:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<div class="jet-form-editor__row-notice"><?php
									_e( 'Set form fields names to to get user data from', 'jet-engine' );
								?></div>
								<div class="jet-form-editor__row-error" v-if="! currentItem.fields_map.login || ! currentItem.fields_map.email || ! currentItem.fields_map.password"><?php
									_e( 'User Login, Email and Password fields can\'t be empty', 'jet-engine' );
								?></div>
								<div class="jet-form-editor__row-fields">
									<div class="jet-form-editor__row-map" v-for="( uFieldLabel, uField ) in userFields">
										<span>{{ uFieldLabel }}</span>
										<select v-model="currentItem.fields_map[ uField ]">
											<option value="">--</option>
											<option v-for="field in availableFields" :value="field">{{ field }}</option>
										</select>
									</div>
								</div>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'register_user' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Log In User after Register:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<input type="checkbox" value="yes" v-model="currentItem.log_in">
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'register_user' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Add User ID to form data:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<input type="checkbox" value="yes" v-model="currentItem.add_user_id">
								<div class="jet-form-editor__row-control-desc">
									<?php _e( 'Registered user ID will be added to form data. If form is filled by logged in user - current user ID will be added to form data.', 'jet-engine' ); ?>
								</div>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'email' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Subject:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<input type="text" v-model="currentItem.email.subject">
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'email' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'From Name:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<input type="text" v-model="currentItem.email.from_name">
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'email' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php
								_e( 'From Email Address:', 'jet-engine' );
							?></div>
							<div class="jet-form-editor__row-control">
								<input type="text" v-model="currentItem.email.from_address">
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'webhook' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Webhook URL:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<input type="text" v-model="currentItem.webhook_url">
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'email' === currentItem.type">
							<div class="jet-form-editor__row-label">
								<?php _e( 'Content:', 'jet-engine' ); ?>
								<div class="jet-form-editor__row-notice">
									<?php _e( 'Available macros:', 'jet-engine' ); ?>
									<div v-for="field in availableFields">
										- <i>%{{ field }}%</i>
									</div>
								</div>
							</div>
							<div class="jet-form-editor__row-control">
								<textarea v-model="currentItem.email.content"></textarea>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'redirect' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Redirect to:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<select type="text" v-model="currentItem.redirect_type">
									<option value="static_page"><?php _e( 'Static page', 'jet-engine' ) ?></option>
									<option value="custom_url"><?php _e( 'Custom URL', 'jet-engine' ) ?></option>
								</select>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'redirect' === currentItem.type && 'static_page' === currentItem.redirect_type">
							<div class="jet-form-editor__row-label"><?php _e( 'Select page:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<select type="text" v-model="currentItem.redirect_page">
									<option v-for="(pageTitle, pageID) in allPages" :value="pageID">{{ pageTitle }}</option>
								</select>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'redirect' === currentItem.type && 'custom_url' === currentItem.redirect_type">
							<div class="jet-form-editor__row-label"><?php _e( 'Redirect URL:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<input type="text" v-model="currentItem.redirect_url">
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'activecampaign' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'API Data:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<div class="jet-form-editor__input-group">
									<label>
										<?php _e( 'API URL:', 'jet-engine' ); ?><br>
										<input type="text" v-model="currentItem.activecampaign.api_url">
									</label>
									<label>
										<?php _e( 'API Key:', 'jet-engine' ); ?><br>
										<input type="text" v-model="currentItem.activecampaign.api_key">
									</label>
								</div>
								<div class="jet-form-editor__row-notice"><?php
									printf(
										__( 'How to obtain your ActiveCampaign API URL and Key? More info %s.', 'jet-engine' ),
										'<a href="https://help.activecampaign.com/hc/en-us/articles/207317590-Getting-started-with-the-API" target="_blank">' . __( 'here', 'jet-engine' ) . '</a>'
									);
								?></div>
								<button type="button"
									class="button button-default button-large jet-form-validate-button"
									:class="{
										'loading': validateActiveCampAPI,
										'is-valid': true === currentItem.activecampaign.isValidAPI && !validateActiveCampAPI,
										'is-invalid': false === currentItem.activecampaign.isValidAPI && !validateActiveCampAPI
									}"
									v-if="currentItem.activecampaign.api_url && currentItem.activecampaign.api_key"
									@click="validateActiveCampaignAPI"
								>
									<i class="dashicons"></i>
									<?php _e('Validate API Data', 'jet-engine' ); ?>
								</button>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'activecampaign' === currentItem.type && currentItem.activecampaign.isValidAPI">
							<div class="jet-form-editor__row-label"><?php _e( 'List Id:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<div class="jet-form-editor__input-group">
									<select v-model="currentItem.activecampaign.list_id">
										<option value="">--</option>
										<option v-for="(listName, listId) in currentItem.activecampaign.lists" :value="listId">{{listName}}</option>
									</select>
									<button type="button"
										class="button button-default button-large jet-form-load-button"
										:class="{'loading': loadingActiveCampLists}"
										@click="getActiveCampaignLists"
									>
										<i class="dashicons dashicons-update"></i>
										<?php _e('Update List', 'jet-engine' ); ?>
									</button>
								</div>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'activecampaign' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Fields Map:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<div class="jet-form-editor__row-notice"><?php
									_e( 'Set form fields names to to get user data from', 'jet-engine' );
								?></div>
								<div class="jet-form-editor__row-error" v-if="! currentItem.activecampaign.fields_map.email"><?php
									_e( 'Email field can\'t be empty', 'jet-engine' );
								?></div>
								<div class="jet-form-editor__row-fields">
									<div class="jet-form-editor__row-map" v-for="( acFieldLabel, acField ) in activecampFields">
										<span>{{ acFieldLabel }}</span>
										<select v-model="currentItem.activecampaign.fields_map[ acField ]">
											<option value="">--</option>
											<option v-for="field in availableFields" :value="field">{{ field }}</option>
										</select>
									</div>
								</div>
							</div>
						</div>
						<div class="jet-form-editor__row" v-if="'activecampaign' === currentItem.type">
							<div class="jet-form-editor__row-label"><?php _e( 'Tags:', 'jet-engine' ); ?></div>
							<div class="jet-form-editor__row-control">
								<input type="text" v-model="currentItem.activecampaign.tags">
								<div class="jet-form-editor__row-notice"><?php
									_e( 'Add as many tags as you want, comma separated.', 'jet-engine' );
								?></div>
							</div>
						</div>
						<?php do_action( 'jet-engine/forms/booking/notifications/fields-after' ); ?>
					</div>
					<div class="jet-form-editor__actions">
						<button type="button" class="button button-primary button-large" @click="applyItemChanges"><?php
							_e( 'Apply Changes', 'jet-engine' );
						?></button>
						<button type="button" class="button button-default button-large" @click="cancelItemChanges"><?php
							_e( 'Cancel', 'jet-engine' );
						?></button>
					</div>
				</div>
				</div>
			</slick-item>
		</slick-list>
	</div>
	<div class="jet-form-canvas__actions">
		<span></span>
		<button type="button" class="jet-form-canvas__add" @click="addField()"><?php
			_e( 'Add Notification', 'jet-engine' );
		?></button>
	</div>
	<div class="jet-form-canvas__result">
		<textarea name="_notifications_data">{{ resultJSON }}</textarea>
	</div>
</div>