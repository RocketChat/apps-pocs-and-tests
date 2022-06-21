import {
    IAppAccessors,
    IConfigurationExtend,
    ILogger,
    IModify,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { InputElementDispatchAction, IUIKitResponse, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';

export class InputElementBlockAction extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new OpenModal(this));
    }

    public async executeBlockActionHandler(context: UIKitBlockInteractionContext): Promise<IUIKitResponse> {
        console.info('[APP BLOCK ACTION]');
        const data = context.getInteractionData();
        console.info(JSON.stringify(data, null, 2));

        return {
            success: true,
        };
    }

    public async executeViewSubmitHandler(): Promise<IUIKitResponse> {
        return {
            success: true,
        };
    }

    public async executeViewClosedHandler(): Promise<IUIKitResponse> {
        return {
            success: true,
        };
    }

}

class OpenModal implements ISlashCommand {
    public command = 'openui';
    public i18nParamsExample = '';
    public i18nDescription = '';
    public providesPreview = false;

    constructor(private readonly app: App) {}

    public async executor(context: SlashCommandContext, _: IRead, modify: IModify): Promise<void> {
        const triggerId = context.getTriggerId() as string;
        const user = context.getSender();
        const [t] = context.getArguments();

        if (['modal', 'm'].includes(t)) {
            await modify.getUiController().openModalView(this.getSimpleView(modify), { triggerId }, user);
        } else if (['ctx', 'c'].includes(t)) {
            await modify.getUiController().openContextualBarView(this.getSimpleView(modify), { triggerId }, user);
        }

    }

    private getSimpleView(modify: IModify): IUIKitModalViewParam {
        const block = modify.getCreator().getBlockBuilder();

        // text
        block.addInputBlock({
            blockId: 'ablock',
            optional: true,
            element: block.newPlainTextInputElement({
                actionId: 'action',
                placeholder: block.newPlainTextObject('Insert text'),
                dispatchActionConfig: [InputElementDispatchAction.ON_CHARACTER_ENTERED],
            }),
            label: block.newPlainTextObject('action'),
        });

        block.addInputBlock({
            blockId: 'cblock',
            optional: true,
            element: block.newPlainTextInputElement({
                actionId: 'noaction2',
                placeholder: block.newPlainTextObject('Insert text'),
            }),
            label: block.newPlainTextObject('no action'),
        });

        // select
        block.addInputBlock({
            blockId: 'dblock',
            optional: true,
            element: block.newStaticSelectElement({
                placeholder: block.newPlainTextObject('select one action'),
                dispatchActionConfig: [InputElementDispatchAction.ON_ITEM_SELECTED],
                actionId: 'actionselect',
                initialValue: 'ac',
                options: [
                    {
                        text: block.newPlainTextObject('action 1'),
                        value: 'acselect1',
                    },
                    {
                        text: block.newPlainTextObject('action 2'),
                        value: 'acselect2',
                    },
                ],
            }),
            label: block.newPlainTextObject('action select'),
        });

        block.addInputBlock({
            blockId: 'eblock',
            optional: true,
            element: block.newStaticSelectElement({
                placeholder: block.newPlainTextObject('select one no action'),
                actionId: 'actionselect',
                initialValue: 'ac',
                options: [
                    {
                        text: block.newPlainTextObject('action 1'),
                        value: 'acselect1',
                    },
                    {
                        text: block.newPlainTextObject('action 2'),
                        value: 'acselect2',
                    },
                ],
            }),
            label: block.newPlainTextObject('select no action'),
        });

        // multiple select
        block.addInputBlock({
            blockId: 'fblock',
            optional: true,
            element: block.newMultiStaticElement({
                placeholder: block.newPlainTextObject('select m no action'),
                dispatchActionConfig: [InputElementDispatchAction.ON_ITEM_SELECTED],
                actionId: 'actionmselect',
                initialValue: [],
                options: [
                    {
                        text: block.newPlainTextObject('action m 1'),
                        value: 'acmselect1',
                    },
                    {
                        text: block.newPlainTextObject('action m 2'),
                        value: 'acmselect2',
                    },
                ],
            }),
            label: block.newPlainTextObject('action select m'),
        });

        block.addInputBlock({
            blockId: 'gblock',
            optional: true,
            element: block.newMultiStaticElement({
                placeholder: block.newPlainTextObject('select m action'),
                actionId: 'actionmselect',
                initialValue: [],
                options: [
                    {
                        text: block.newPlainTextObject('action m 1'),
                        value: 'acmselect1',
                    },
                    {
                        text: block.newPlainTextObject('action m 2'),
                        value: 'acmselect2',
                    },
                ],
            }),
            label: block.newPlainTextObject('select m no action'),
        });

        return {
            id: 'simple_view',
            title: block.newPlainTextObject('View title'),
            blocks: block.getBlocks(),
            close: block.newButtonElement({
                text: block.newPlainTextObject('close'),
            }),
            submit: block.newButtonElement({
                text: block.newPlainTextObject('ok'),
            }),
        };
    }
}
