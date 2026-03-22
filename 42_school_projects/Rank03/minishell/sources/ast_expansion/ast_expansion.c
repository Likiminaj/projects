/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ast_expansion.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/19 15:51:07 by cpesty            #+#    #+#             */
/*   Updated: 2026/03/20 18:28:54 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		ft_expand_ast(t_ast *ast, t_env *env, int *exit_stat);
int		ft_expand_pipe(t_ast *ast, t_env *env, int *exit_stat);
int		ft_expand_command(t_ast *ast, t_env *env, int *exit_stat);
int		ft_expand_redir(t_redirect *redir, t_env *env, int *exit_stat);
void	restore_sentinels(char *str);

/* Expands variables in AST by recursively processing
commands and redirections. */
int	ft_expand_ast(t_ast *ast, t_env *env, int *exit_stat)
{
	t_redirect	*redirections;

	if (!ast)
		return (1);
	if (ast->type == AST_PIPE)
	{
		if (!ft_expand_pipe(ast, env, exit_stat))
			return (0);
		return (1);
	}
	if (ast->type == AST_COMMAND)
	{
		if (ast->args)
			if (!ft_expand_command(ast, env, exit_stat))
				return (0);
		redirections = ast->redirects;
		while (redirections)
		{
			if (!ft_expand_redir(redirections, env, exit_stat))
				return (0);
			redirections = redirections->next;
		}
	}
	return (1);
}

/* Recursively expands variables in both sides of a pipe. */
int	ft_expand_pipe(t_ast *ast, t_env *env, int *exit_stat)
{
	if (!ft_expand_ast(ast->left, env, exit_stat))
		return (0);
	if (!ft_expand_ast(ast->right, env, exit_stat))
		return (0);
	return (1);
}

/* Expands variables in command arguments, splits on space/tab/newline,
restores sentinels. */
int	ft_expand_command(t_ast *ast, t_env *env, int *exit_stat)
{
	int	count;
	int	i;
	int	added;

	if (!ast || !ast->args)
		return (1);
	count = ft_count_args(ast->args);
	i = 0;
	while (i < count)
	{
		if (dol_found(ast->args[i]) > 0 && !is_dol_only(ast->args[i]))
		{
			if (expand_var(ast, i, exit_stat, env->envp) == 1)
				return (0);
			added = ft_word_split(&ast->args, i, count);
			if (added == -1)
				return (0);
			count += added;
			i += added;
		}
		restore_sentinels(ast->args[i]);
		i++;
	}
	return (1);
}

/* Expands variables in redirection filenames and restores sentinels. */
int	ft_expand_redir(t_redirect *redir, t_env *env, int *exit_stat)
{
	char	*expanded;

	if (!redir || !redir->file)
		return (1);
	if (dol_found(redir->file) > 0 && !is_dol_only(redir->file))
	{
		expanded = expand_string(redir->file, env->envp, exit_stat);
		if (!expanded)
			return (0);
		free(redir->file);
		redir->file = expanded;
	}
	restore_sentinels(redir->file);
	return (1);
}

/* Converts sentinel characters back to dollar signs after expansion. */
void	restore_sentinels(char *str)
{
	int	i;

	if (!str)
		return ;
	i = 0;
	while (str[i])
	{
		if (str[i] == '\x01')
			str[i] = '$';
		else if (str[i] == '\x02')
			str[i] = ' ';
		i++;
	}
}
