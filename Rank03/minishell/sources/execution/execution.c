/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   execution.c                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/30 11:12:42 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/04 19:58:03 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int	ft_exec_ast(t_ast *ast, t_env *env);

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
