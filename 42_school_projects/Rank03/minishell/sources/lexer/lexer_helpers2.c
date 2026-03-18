/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   lexer_helpers2.c                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/19 17:49:47 by lraghave          #+#    #+#             */
/*   Updated: 2026/03/18 15:21:32 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

/* Copy text inside quotes, converting $ to \x01 in single quotes. */
int	ft_copy_text(char *word, char quote, int *i, char *clean)
{
	int	j;

	j = 0;
	while (word[*i] && word[*i] != quote)
	{
		if (quote == '\'' && word[*i] == '$')
			clean[j++] = '\x01';
		else
			clean[j++] = word[*i];
		(*i)++;
	}
	return (j);
}

/* Check if the last token is a pipe = incomplete argument*/
int	ft_last_token_is_pipe(t_token *tokens)
{
	if (!tokens)
		return (0);
	while (tokens->next)
		tokens = tokens->next;
	return (tokens->type == TOKEN_PIPE);
}

/* Continuously reads and appends user input to the current 
line until it no longer ends with a pipe (|), ensuring the 
command is complete before returning it.*/
static char	*ft_read_continuation(char *line, int *exit_status)
{
	t_token	*tokens;
	char	*extra;
	char	*tmp;

	tokens = ft_lex(line, exit_status);
	while (tokens && ft_last_token_is_pipe(tokens))
	{
		ft_free_tokens(&tokens);
		extra = readline("> ");
		if (!extra)
			break ;
		tmp = ft_strjoin(line, " ");
		free(line);
		line = ft_strjoin(tmp, extra);
		free(tmp);
		free(extra);
		if (!line)
			return (NULL);
		tokens = ft_lex(line, exit_status);
	}
	ft_free_tokens(&tokens);
	return (line);
}
