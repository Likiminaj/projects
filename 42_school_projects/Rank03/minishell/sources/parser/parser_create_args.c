/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   parser_create_args.c                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/02 11:21:27 by lraghave          #+#    #+#             */
/*   Updated: 2026/03/18 15:11:07 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

// prototype(s)
static void	ft_fill_args(char **args, t_token **tokens, int count);
static void	ft_free_partial(char **args, int i);
static int	ft_is_redir(t_token_type t);

/* Allocates and fills the args array from word tokens. */
char	**ft_build_args(t_token **tokens, int *exit_status)
{
	char	**args;
	int		count;

	count = ft_count_words(*tokens);
	if (count < 0)
		return (ft_putendl_fd("minishell: parse error near `\\n'", 2),
			*exit_status = 2, NULL);
	args = malloc(sizeof(char *) * (count + 1));
	if (!args)
		return (ft_malloc_error(exit_status), NULL);
	ft_fill_args(args, tokens, count);
	return (args);
}

/* Copies word tokens into the args array, skipping redirections. */
static void	ft_fill_args(char **args, t_token **tokens, int count)
{
	int	i;

	i = 0;
	while (*tokens && (*tokens)->type != TOKEN_PIPE)
	{
		if (ft_is_redir((*tokens)->type))
		{
			if ((*tokens)->next)
				*tokens = (*tokens)->next->next;
			else
				*tokens = NULL;
			continue ;
		}
		if ((*tokens)->type == TOKEN_WORD && i < count)
		{
			args[i] = ft_strdup((*tokens)->word);
			if (!args[i])
				return (ft_free_partial(args, i), (void)0);
			i++;
		}
		*tokens = (*tokens)->next;
	}
	args[i] = NULL;
}

/* Frees a partially built args array on allocation failure. */
static void	ft_free_partial(char **args, int i)
{
	while (i > 0)
		free(args[--i]);
	free(args);
}

/* Checks if a token type is a redirection operator. */
static int	ft_is_redir(t_token_type t)
{
	return (t == TOKEN_REDIRECT_IN || t == TOKEN_REDIRECT_OUT
		|| t == TOKEN_REDIRECT_APPEND || t == TOKEN_HEREDOC);
}
