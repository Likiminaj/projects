/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ast_expansion.c                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/19 15:51:07 by cpesty            #+#    #+#             */
/*   Updated: 2026/02/11 16:42:33 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		ft_expand_ast(t_ast *ast, t_env *env, int *exit_stat);
int		ft_expand_pipe(t_ast *ast, t_env *env, int *exit_stat);
int		ft_expand_command(t_ast *ast, t_env *env, int *exit_stat);
int		ft_expand_redir(t_redirect *redir, t_env *env, int *exit_stat);
void	restore_sentinels(char *str);

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

int	ft_expand_pipe(t_ast *ast, t_env *env, int *exit_stat)
{
	if (!ft_expand_ast(ast->left, env, exit_stat))
		return (0);
	if (!ft_expand_ast(ast->right, env, exit_stat))
		return (0);
	return (1);
}

int	ft_expand_command(t_ast *ast, t_env *env, int *exit_stat)
{
	int	i;

	if (!ast || !ast->args)
		return (1);
	i = 0;
	while (ast->args[i] != NULL)
	{
		if (dol_found(ast->args[i]) > 0 && !is_dol_only(ast->args[i]))
		{
			if (expand_var(ast, i, exit_stat, env->envp) == 1)
				return (0);
		}
		restore_sentinels(ast->args[i]);
		i++;
	}
	return (1);
}

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
		i++;
	}
}
