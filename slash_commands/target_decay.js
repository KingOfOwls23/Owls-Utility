const { SlashCommandBuilder } = require('discord.js');
const { lightgreen } = require('../jsons/colors.json');
const decayMult = [
    1, 1, 1, 1, 1, 1.0514814, 1.1057236, 1.1628803, 1.2231139, 1.2865961, 1.3535084, 1.4240429, 1.4984032, 1.5768039,
    1.6594728, 1.7466506, 1.8385919, 1.9355664, 2.0378594, 2.1457734, 2.2596276, 2.3797607, 2.5065317, 2.6403196, 2.7815268,
    2.930579, 3.087927, 3.2540488, 3.28, 3.31, 3.38, 3.423333333, 3.473333333, 3.523333333, 3.573333333, 3.623333333,
    3.673333333, 3.723333333, 3.773333333, 3.823333333, 3.873333333, 3.923333333, 3.973333333, 4.023333333, 4.073333333,
    4.123333333, 4.173333333, 4.223333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333,
    4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333,
    4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 0
];
const decay = require('../jsons/decay.json');

builder = new SlashCommandBuilder()
    .setName('target_decay')
    .setDescription('Calculate when will a CT tile reach desired score via decay')
    .addStringOption((option) => 
        option.setName('original_score').setDescription('Original score of a tile').setRequired(true))
    .addIntegerOption((option) =>
        option.setName('target_score').setDescription('Score which you want to be reached.').setRequired(true))
    .addStringOption((option) =>
        option.setName('rate_expires_in').setDescription('Put rate expires in from game here Hr:Min:sec.').setRequired(true))
    .addStringOption((option) =>
        option.setName('tile_name').setDescription('Optional name of tile to be included in response').setRequired(false)
    );

function validateInput(interaction) {
    score = interaction.options.getString('original_score');
    target_score = interaction.options.getInteger('target_score');
    rate_expires_in = interaction.options.getString('rate_expires_in');

    if (isNaN(score)) {
        let keys = score.split(':');
        if (keys.length === 1 || keys.length > 3)
            return 'score must be of form `hour:minute:second` e.g. `1:32:15.977` means 1 hour 32 minutes 15.977 seconds';

        let nans = keys.find((key) => isNaN(key));
        if (nans && nans.length > 0)
            return 'score must be of form `hour:minute:second` e.g. `1:32:15.977` means 1 hour 32 minutes 15.977 seconds';
    }
    if (isNaN(rate_expires_in)) {
        let keys = rate_expires_in.split(':');
        if (keys.length === 1 || keys.length > 3)
            return 'rate_expires_in must be of form `hour:minute:second` e.g. `1:32:15.977` means 1 hour 32 minutes 15.977 seconds';

        let nans = keys.find((key) => isNaN(key));
        if (nans && nans.length > 0)
            return 'rate_expires_in must be of form `hour:minute:second` e.g. `1:32:15.977` means 1 hour 32 minutes 15.977 seconds';
    }
    if (isNaN(target_score)) {
        let keys = target_score.split(':');
        if (keys.length === 1 || keys.length > 3)
            return 'target score must be of form `hour:minute:second` e.g. `1:32:15.977` means 1 hour 32 minutes 15.977 seconds';

        let nans = keys.find((key) => isNaN(key));
        if (nans && nans.length > 0)
            return 'target score must be of form `hour:minute:second` e.g. `1:32:15.977` means 1 hour 32 minutes 15.977 seconds';
    }

}
async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });

    let score = interaction.options.getString('original_score');
    let remaining_hours = 72;
    let target_score = interaction.options.getInteger('target_score');
    let rate_expires_in = interaction.options.getString('rate_expires_in');
    let TileName = `The tile **${interaction.options.getString('tile_name')}**` || 'Your tile' ;
 

    let num_score = !isNaN(score) ? parseFloat(score) : timeToSeconds(score);
    let num_target_score = !isNaN(target_score) ? parseFloat(target_score) : timeToSeconds(target_score);
    let HoursPassed = Math.floor((24*3600-timeToSeconds(rate_expires_in))/3600);
    let MinutesPassed = getMinutes(timeToSeconds(rate_expires_in))

    num_score /= decayMult[72 - remaining_hours];

    let table = '```\nhr | score\n';
    let prevScore;
    table += `${score}, ${remaining_hours}, ${target_score}, ${num_score}, ${num_score}, ${num_target_score}\n`;
    let CurrentTime = 0
    let remaining_hours_data = 0
    decay.every((obj) => {
        let decayedScore = Math.round(obj.mult * num_score);
        console.log(`${obj.h} | ${decayedScore}`)
        table += `${decayedScore}\n`;
        if (decayedScore >= target_score) {
            table += `Decays passed: ${HoursPassed}, Minutes to next decay: ${MinutesPassed}\n`;
            console.log(Date.now() / 1000, 72-obj.h-HoursPassed-1, obj.h, HoursPassed)
            CurrentTime = Math.floor(Date.now() / 1000);
            remaining_hours_data = 72-obj.h-HoursPassed-1
            table += `Timestamp: <t:${CurrentTime+remaining_hours_data*3600+MinutesPassed*60}>`
            return false
        }
        return true
    });
    if (CurrentTime > 0) {
        return await interaction.reply(`🕒 ${TileName} is expected to reach a score of **${num_target_score}** on <t:${CurrentTime+remaining_hours_data*3600+MinutesPassed*60}>`)
    }
    else {
        return await interaction.reply(`🕒 ${TileName} is expected to **NEVER** reach a score of **${num_target_score}**`)
    }
         
    
    //table += '```';

    //const embed = new Discord.EmbedBuilder().setDescription(table).setColor(lightgreen);

   // return await interaction.reply({ embeds: [embed] });
}

module.exports = {
    data: builder,
    execute
};

function getMinutes(seconds) {
    return Math.floor((seconds % 3600) / 60);
}

function timeToSeconds(time) {
    // should be hms

    let keys = time
        .split(':')
        .reverse()
        .map((key) => parseFloat(key));
    return keys.reduce((accumulator, value, index) => {
        return accumulator + value * Math.pow(60, index);
    });
}
function secondsToTime(s) {
    let ms = Math.round(s * 1000);
    let milliseconds = ms % 1000;
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);
    let hours = Math.floor((ms / (1000 * 3600)) % 3600);

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    milliseconds = milliseconds < 100 ? '0' + milliseconds : milliseconds;

    // does not show minutes or hours if its like 3 seconds
    let string = `${seconds}.${milliseconds}`;
    if (ms * 4.28 > 60000) string = `${minutes}:` + string;
    if (ms * 4.28 > 3600000) string = `${hours}:` + string;
    return string;
}
