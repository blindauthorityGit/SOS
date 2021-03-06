<?php
/**
 * Main dashboard template
 */
?>
<div>
	<div class="wrap">
		<h1 class="cs-vui-title"><?php _e( 'User Profile Builder', 'jet-engine' ); ?></h1>
		<div class="cx-vui-panel">
			<cx-vui-tabs
				:in-panel="false"
				value="pages"
				layout="vertical"
				ref="settingsTabs"
			>
				<cx-vui-tabs-panel
					name="pages"
					label="<?php _e( 'Pages', 'jet-engine' ); ?>"
					key="pages"
				>
					<cx-vui-select
						name="account_page"
						label="<?php _e( 'Account Page', 'jet-engine' ); ?>"
						description="<?php _e( 'Select page to use as current user account page', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						size="fullwidth"
						placeholder="<?php _e( 'Select page...', 'jet-engine' ); ?>"
						:options-list="pagesList"
						v-model="settings.account_page"
					></cx-vui-select>
					<cx-vui-switcher
						label="<?php _e( 'Users page', 'jet-engine' ); ?>"
						description="<?php _e( 'Add public page for all user list', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						v-model="settings.enable_users_page"
					></cx-vui-switcher>
					<cx-vui-select
						name="users_page"
						label="<?php _e( 'Users Page', 'jet-engine' ); ?>"
						description="<?php _e( 'Select page to use as public users page', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						size="fullwidth"
						placeholder="<?php _e( 'Select page...', 'jet-engine' ); ?>"
						:options-list="pagesList"
						v-if="settings.enable_users_page"
						v-model="settings.users_page"
					></cx-vui-select>
					<cx-vui-switcher
						label="<?php _e( 'Single user page', 'jet-engine' ); ?>"
						description="<?php _e( 'Add public page for single user', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						v-model="settings.enable_single_user_page"
					></cx-vui-switcher>
					<cx-vui-select
						name="user_page"
						label="<?php _e( 'Single User Page', 'jet-engine' ); ?>"
						description="<?php _e( 'Select page to use as public single user page', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						size="fullwidth"
						placeholder="<?php _e( 'Select page...', 'jet-engine' ); ?>"
						:options-list="pagesList"
						v-if="settings.enable_single_user_page"
						v-model="settings.single_user_page"
					></cx-vui-select>
					<cx-vui-select
						name="user_page_rewrite"
						label="<?php _e( 'User Page Rewrite', 'jet-engine' ); ?>"
						description="<?php _e( 'Select rewrite base for single user page', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						size="fullwidth"
						:options-list="rewriteOptions"
						v-if="settings.enable_single_user_page"
						v-model="settings.user_page_rewrite"
					></cx-vui-select>
					<cx-vui-select
						label="<?php _e( 'Template mode', 'jet-engine' ); ?>"
						description="<?php _e( 'How subpage templates will be processing. If rewrite selected - account page content will be totally rewritten, if content - subpages content rendered with separate widget inside page content.', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						size="fullwidth"
						:options-list="[
							{
								value: 'rewrite',
								label: '<?php _e( 'Rewrite', 'jet-engine' ); ?>'
							},
							{
								value: 'content',
								label: '<?php _e( 'Content', 'jet-engine' ); ?>'
							},
						]"
						v-model="settings.template_mode"
					></cx-vui-select>
					<div
						class="cx-vui-component"
						v-if="'content' === settings.template_mode"
					>
						<div class="cx-vui-component__meta">
							<label class="cx-vui-component__label"><?php
								_e( 'Note:', 'jet-engine' );
							?></label>
							<div class="cx-vui-component__desc"><?php
								_e( 'If Content mode selected you need to add Profile Content widget to your Account or User page content!', 'jet-engine' );
							?></div>
						</div>
					</div>
					<cx-vui-switcher
						label="<?php _e( 'Use page content', 'jet-engine' ); ?>"
						description="<?php _e( 'If subpage template is not set, use default page content', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						:conditions="[
							{
								input: this.settings.template_mode,
								compare: 'equal',
								value: 'rewrite',
							}
						]"
						v-model="settings.force_template_rewrite"
					></cx-vui-switcher>
					<cx-vui-switcher
						label="<?php _e( 'Hide admin bar', 'jet-engine' ); ?>"
						description="<?php _e( 'Disable admin bar for non-admins', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						v-model="settings.disable_admin_bar"
					></cx-vui-switcher>
					<cx-vui-component-wrapper
						:wrapper-css="[ 'vertical-fullwidth' ]"
					>
						<cx-vui-button
							button-style="accent"
							:loading="saving"
							@click="saveSettings"
						>
							<span
								slot="label"
								v-html="'<?php _e( 'Save', 'jet-engine' ); ?>'"
							></span>
						</cx-vui-button>
					</cx-vui-component-wrapper>
				</cx-vui-tabs-panel>
				<cx-vui-tabs-panel
					name="account_page"
					label="<?php _e( 'Account Page', 'jet-engine' ); ?>"
					key="account_page"
				>
					<cx-vui-select
						label="<?php _e( 'For not authorized users', 'jet-engine' ); ?>"
						description="<?php _e( 'What to do when non-authorized user try to access account page', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						size="fullwidth"
						:options-list="notLoggedActions"
						v-model="settings.not_logged_in_action"
					></cx-vui-select>
					<cx-vui-f-select
						label="<?php _e( 'Template', 'jet-engine' ); ?>"
						description="<?php _e( 'Select Elementor/Listing Item template to show as page content for non-authorized user', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						:remote="true"
						:remote-callback="getPosts"
						size="fullwidth"
						:multiple="false"
						v-if="'template' === settings.not_logged_in_action"
						v-model="settings.not_logged_in_template"
					></cx-vui-f-select>
					<cx-vui-input
						label="<?php _e( 'Redirect URL', 'jet-engine' ); ?>"
						description="<?php _e( 'Set page URL to redirect', 'jet-engine' ); ?>"
						:wrapper-css="[ 'equalwidth' ]"
						size="fullwidth"
						v-if="'page_redirect' === settings.not_logged_in_action"
						v-model="settings.not_logged_in_redirect"
					></cx-vui-input>
					<div class="cx-vui-inner-panel">
						<cx-vui-repeater
							button-label="<?php _e( '+ Add New Subpage', 'jet-engine' ); ?>"
							button-style="link-accent"
							button-size="default"
							v-model="settings.account_page_structure"
							@add-new-item="addNewPage( 'account_page_structure' )"
						>
							<cx-vui-repeater-item
								v-for="( page, index ) in settings.account_page_structure"
								:title="settings.account_page_structure[ index ].title"
								:subtitle="settings.account_page_structure[ index ].slug"
								:collapsed="isCollapsed( page )"
								:index="index"
								@clone-item="clonePage( $event, 'account_page_structure' )"
								@delete-item="deletePage( $event, 'account_page_structure' )"
								:key="'page-' + index"
							>
								<cx-vui-input
									label="<?php _e( 'Title', 'jet-engine' ); ?>"
									description="<?php _e( 'Page title. Will be added into account menu and page meta title', 'jet-engine' ); ?>"
									:wrapper-css="[ 'equalwidth' ]"
									size="fullwidth"
									:value="settings.account_page_structure[ index ].title"
									@input="setPageProp( index, 'title', $event, 'account_page_structure' )"
									@on-input-change="preSetSlug( index, 'account_page_structure' )"
								></cx-vui-input>
								<cx-vui-input
									label="<?php _e( 'Slug', 'jet-engine' ); ?>"
									description="<?php _e( 'Page slug. Will be added to base page URL', 'jet-engine' ); ?>"
									:wrapper-css="[ 'equalwidth' ]"
									size="fullwidth"
									:value="settings.account_page_structure[ index ].slug"
									@input="setPageProp( index, 'slug', $event, 'account_page_structure' )"
								></cx-vui-input>
								<cx-vui-f-select
									label="<?php _e( 'Template', 'jet-engine' ); ?>"
									description="<?php _e( 'Page template. Select Elementor/Listing Item template to show on current page', 'jet-engine' ); ?>"
									:wrapper-css="[ 'equalwidth' ]"
									:remote="true"
									:remote-callback="getPosts"
									size="fullwidth"
									:multiple="false"
									:value="settings.account_page_structure[ index ].template"
									@input="setPageProp( index, 'template', $event, 'account_page_structure' )"
								></cx-vui-f-select>
								<cx-vui-switcher
									label="<?php _e( 'Hide from menu', 'jet-engine' ); ?>"
									description="<?php _e( 'Page will be hidden from profile menu, but accessible by URL', 'jet-engine' ); ?>"
									:wrapper-css="[ 'equalwidth' ]"
									:value="settings.account_page_structure[ index ].hide"
									@input="setPageProp( index, 'hide', $event, 'account_page_structure' )"
								></cx-vui-switcher>
							</cx-vui-repeater-item>
						</cx-vui-repeater>
					</div>
					<cx-vui-component-wrapper
						:wrapper-css="[ 'vertical-fullwidth' ]"
					>
						<cx-vui-button
							button-style="accent"
							:loading="saving"
							@click="saveSettings"
						>
							<span
								slot="label"
								v-html="'<?php _e( 'Save', 'jet-engine' ); ?>'"
							></span>
						</cx-vui-button>
					</cx-vui-component-wrapper>
				</cx-vui-tabs-panel>
				<cx-vui-tabs-panel
					name="user_page"
					label="<?php _e( 'User Page', 'jet-engine' ); ?>"
					key="user_page"
					v-if="settings.enable_single_user_page"
				>
					<br>
					<div class="cx-vui-inner-panel">
						<cx-vui-repeater
							button-label="<?php _e( '+ Add New Subpage', 'jet-engine' ); ?>"
							button-style="link-accent"
							button-size="default"
							v-model="settings.user_page_structure"
							@add-new-item="addNewPage( 'user_page_structure' )"
						>
							<cx-vui-repeater-item
								v-for="( page, index ) in settings.user_page_structure"
								:title="settings.user_page_structure[ index ].title"
								:subtitle="settings.user_page_structure[ index ].slug"
								:collapsed="isCollapsed( page )"
								:index="index"
								@clone-item="clonePage( $event, 'user_page_structure' )"
								@delete-item="deletePage( $event, 'user_page_structure' )"
								:key="'user_page-' + index"
							>
								<cx-vui-input
									label="<?php _e( 'Title', 'jet-engine' ); ?>"
									description="<?php _e( 'Page title. Will be added into account menu and page meta title', 'jet-engine' ); ?>"
									:wrapper-css="[ 'equalwidth' ]"
									size="fullwidth"
									:value="settings.user_page_structure[ index ].title"
									@input="setPageProp( index, 'title', $event, 'user_page_structure' )"
									@on-input-change="preSetSlug( index, 'user_page_structure' )"
								></cx-vui-input>
								<cx-vui-input
									label="<?php _e( 'Slug', 'jet-engine' ); ?>"
									description="<?php _e( 'Page slug. Will be added to base page URL', 'jet-engine' ); ?>"
									:wrapper-css="[ 'equalwidth' ]"
									size="fullwidth"
									:value="settings.user_page_structure[ index ].slug"
									@input="setPageProp( index, 'slug', $event, 'user_page_structure' )"
								></cx-vui-input>
								<cx-vui-f-select
									label="<?php _e( 'Template', 'jet-engine' ); ?>"
									description="<?php _e( 'Page template. Select Elementor/Listing Item template to show on current page', 'jet-engine' ); ?>"
									:wrapper-css="[ 'equalwidth' ]"
									:remote="true"
									:remote-callback="getPosts"
									size="fullwidth"
									:multiple="false"
									:value="settings.user_page_structure[ index ].template"
									@input="setPageProp( index, 'template', $event, 'user_page_structure' )"
								></cx-vui-f-select>
								<cx-vui-switcher
									label="<?php _e( 'Hide from menu', 'jet-engine' ); ?>"
									description="<?php _e( 'Page will be hidden from profile menu, but accessible by URL', 'jet-engine' ); ?>"
									:wrapper-css="[ 'equalwidth' ]"
									:value="settings.user_page_structure[ index ].hide"
									@input="setPageProp( index, 'hide', $event, 'user_page_structure' )"
								></cx-vui-switcher>
								<cx-vui-select
									label="<?php _e( 'Page Visibility', 'jet-engine' ); ?>"
									description="<?php _e( 'Who can access this page', 'jet-engine' ); ?>"
									:wrapper-css="[ 'equalwidth' ]"
									size="fullwidth"
									:options-list="visibilityOptions"
									:value="settings.user_page_structure[ index ].access"
									@input="setPageProp( index, 'access', $event, 'user_page_structure' )"
								></cx-vui-select>
							</cx-vui-repeater-item>
						</cx-vui-repeater>
					</div>
					<cx-vui-component-wrapper
						:wrapper-css="[ 'vertical-fullwidth' ]"
					>
						<cx-vui-button
							button-style="accent"
							:loading="saving"
							@click="saveSettings"
						>
							<span
								slot="label"
								v-html="'<?php _e( 'Save', 'jet-engine' ); ?>'"
							></span>
						</cx-vui-button>
					</cx-vui-component-wrapper>
				</cx-vui-tabs-panel>
				<?php do_action( 'jet-engine/profile-builder/settings/tabs' ); ?>
			</cx-vui-tabs>
		</div>
	</div>
</div>