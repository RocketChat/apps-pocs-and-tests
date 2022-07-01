import {
    IAppAccessors,
    IConfigurationExtend,
    ILogger,
    IModify,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class Agendav4testApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await Promise.all([
            configuration.slashCommands.provideSlashCommand(new Scheduler(this)),
            configuration.scheduler.registerProcessors([taskProcessor()]),
        ]);
    }
}

class Scheduler implements ISlashCommand {
    public command = 'scheduler';
    public i18nParamsExample = '';
    public i18nDescription = '';
    public providesPreview = false;

    constructor(private readonly app: App) {}

    public async executor(context: SlashCommandContext, read: IRead, modify: IModify): Promise<void> {
        const user = context.getSender();
        const room = context.getRoom();
        const triggerId = context.getTriggerId();
        const subcommand = this.getSubcommand(context);
        const subcommandArguments = this.getSubcommandArguments(context);

        if (!subcommand) {
          return this.displayAppHelpMessage(user, room, modify);
        }

        switch (subcommand) {
            case 'r':
            case 'recurring': {
                const jobId = await modify.getScheduler().scheduleRecurring({
                    id: 'sendMessage',
                    skipImmediate: true,
                    interval: '10 seconds',
                    data: {
                        user,
                        room,
                        triggerId,
                        type: 'recurring',
                    },
                });

                const jobIdMsg = `[${triggerId}] Scheduling a recurring job of jobId ${jobId}`;
                await sendMessage(user, room, modify, jobIdMsg);
                break;
            }

            case 'o':
            case 'onetime': {
                const jobId = await modify.getScheduler().scheduleOnce({
                    id: 'sendMessage',
                    when: 'in 10 seconds',
                    data: {
                        user,
                        room,
                        triggerId,
                        type: 'one time',
                    },
                });

                const jobIdMsg = `[${triggerId}] Scheduling a one time job of jobId ${jobId}`;
                await sendMessage(user, room, modify, jobIdMsg);
                break;
            }

            case 'c':
            case 'cancel': {
                const [jobId] = subcommandArguments;
                let cancelJobMsg = '';
                try {
                    await modify.getScheduler().cancelJob(jobId);
                    cancelJobMsg = `[${triggerId}] Canceled a scheduled job of jobId ${jobId}`;
                } catch (error) {
                    cancelJobMsg = `[${triggerId}] Could not canceling a scheduled job of jobId ${jobId}
                    Reason: ${error.message}`;
                }

                await sendMessage(user, room, modify, cancelJobMsg);
                break;
            }

            default:
                await this.displayAppHelpMessage(user, room, modify);
                break;
        }

        room.displayName
    }

    private getSubcommand(context: SlashCommandContext): string {
        const [subcommand] = context.getArguments();
        return subcommand;
    }

    private getSubcommandArguments(context: SlashCommandContext): string[] {
        const [, ...rest] = context.getArguments();
        return rest;
    }

    private async displayAppHelpMessage(user: IUser, room: IRoom, modify: IModify, message?: string): Promise<void> {
        return sendMessage(user, room, modify, message || 'Help');
    }

}

function taskProcessor(): IProcessor {
    return {
        id: 'sendMessage',
        processor: processorLogic,
    };
}

async function processorLogic(context: IJobContext, _: IRead, modify: IModify): Promise<void> {
    const message = `[${context.jobId}] Scheduled job started by user ${context.user.name} at the ${context.room?.displayName || context.room.id} room`

    await sendMessage(context.user, context.room, modify, message)
  console.log(context);
}

async function sendMessage(sender: IUser, room: IRoom, modify: IModify, message: string): Promise<void> {
    const messageStructure = modify.getCreator().startMessage();

    messageStructure
    .setSender(sender)
    .setRoom(room)
    .setText(message);

    await modify.getCreator().finish(messageStructure);
}
