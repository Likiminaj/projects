/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   execution.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cpesty <chlpesty@gmail.com>                +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/30 11:12:42 by chlpesty          #+#    #+#             */
/*   Updated: 2026/03/18 14:56:16 by cpesty           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int	ft_exec_ast(t_ast *ast, t_env *env);

/* Executes an AST node by dispatching to command or pipe execution. */
int	ft_exec_ast(t_ast *ast, t_env *env)
{
	if (!ast)
		return (0);
	if (ast->type == AST_COMMAND)
		return (exec_command(ast, env));
	else if (ast->type == AST_PIPE)
		return (exec_pipe(ast, env));
	return (1);
}
